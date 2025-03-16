import { ResourceConfig } from './resourceGenerator';

/**
 * Generates Swagger setup code
 */

export function generateSwaggerSetup(config: ResourceConfig): string {
  return `// src/swagger.ts
import * as swaggerUi from 'swagger-ui-express';
import express from 'express';

export function setupSwagger(app: express.Express): void {
  // Create manual OpenAPI spec directly from resource config
  const spec = {
    openapi: '3.0.0',
    info: {
      title: '${config.name} API',
      version: '1.0.0',
      description: 'API for managing ${config.name.toLowerCase()}'
    },
    servers: [
      {
        url: '/api',
        description: 'API Server'
      }
    ],
    tags: [
      {
        name: '${config.name}',
        description: '${config.name} operations'
      }
    ],
    paths: {
      '${config.basePath}': {
        get: {
          summary: 'Get all ${config.name.toLowerCase()}s',
          tags: ['${config.name}'],
          responses: {
            '200': {
              description: 'List of ${config.name.toLowerCase()}s',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/${config.name}'
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create a new ${config.name.toLowerCase()}',
          tags: ['${config.name}'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Create${config.name}'
                }
              }
            }
          },
          responses: {
            '201': {
              description: '${config.name} created successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/${config.name}'
                  }
                }
              }
            },
            '400': {
              description: 'Invalid input'
            }
          }
        }
      },
      '${config.basePath}/{id}': {
        get: {
          summary: 'Get ${config.name.toLowerCase()} by ID',
          tags: ['${config.name}'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string'
              }
            }
          ],
          responses: {
            '200': {
              description: '${config.name} details',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/${config.name}'
                  }
                }
              }
            },
            '404': {
              description: '${config.name} not found'
            }
          }
        },
        patch: {
          summary: 'Update ${config.name.toLowerCase()}',
          tags: ['${config.name}'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string'
              }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Update${config.name}'
                }
              }
            }
          },
          responses: {
            '200': {
              description: '${config.name} updated',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/${config.name}'
                  }
                }
              }
            },
            '404': {
              description: '${config.name} not found'
            }
          }
        },
        delete: {
          summary: 'Delete ${config.name.toLowerCase()}',
          tags: ['${config.name}'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string'
              }
            }
          ],
          responses: {
            '200': {
              description: '${config.name} deleted',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean'
                      }
                    }
                  }
                }
              }
            },
            '404': {
              description: '${config.name} not found'
            }
          }
        }
      },
      '${config.basePath}/{id}/status': {
        patch: {
          summary: 'Update ${config.name.toLowerCase()} status',
          tags: ['${config.name}'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string'
              }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/StatusUpdate'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Status updated',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/${config.name}'
                  }
                }
              }
            },
            '404': {
              description: '${config.name} not found'
            }
          }
        }
      }
    },
    components: {
      schemas: {
        ${config.name}: {
          type: 'object',
          properties: {
            id: { type: 'string' },
${config.properties.map(prop => {
  const propType = prop.type === 'number' ? 'number' : 
                   prop.type === 'boolean' ? 'boolean' : 
                   prop.type.endsWith('[]') ? 'array' : 'string';
                   
  let propDef = `            ${prop.name}: { 
              type: '${propType}'`;
              
  if (prop.type.includes('|')) {
    const enumValues = prop.type.split('|').map(t => t.trim().replace(/['"]/g, ''));
    propDef += `,
              enum: [${enumValues.map(v => `'${v}'`).join(', ')}]`;
  }
  
  if (propType === 'array') {
    propDef += `,
              items: { 
                type: 'string' 
              }`;
  }
  
  propDef += `
            }`;
  return propDef;
}).join(',\n')},
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Create${config.name}: {
          type: 'object',
          required: [${config.properties.filter(p => p.required !== false).map(p => `'${p.name}'`).join(', ')}],
          properties: {
${config.properties.map(prop => {
  const propType = prop.type === 'number' ? 'number' : 
                   prop.type === 'boolean' ? 'boolean' : 
                   prop.type.endsWith('[]') ? 'array' : 'string';
                   
  let propDef = `            ${prop.name}: { 
              type: '${propType}'`;
              
  if (prop.type.includes('|')) {
    const enumValues = prop.type.split('|').map(t => t.trim().replace(/['"]/g, ''));
    propDef += `,
              enum: [${enumValues.map(v => `'${v}'`).join(', ')}]`;
  }
  
  if (propType === 'array') {
    propDef += `,
              items: { 
                type: 'string' 
              }`;
  }
  
  propDef += `
            }`;
  return propDef;
}).join(',\n')}
          }
        },
        Update${config.name}: {
          type: 'object',
          properties: {
${config.properties.map(prop => {
  const propType = prop.type === 'number' ? 'number' : 
                   prop.type === 'boolean' ? 'boolean' : 
                   prop.type.endsWith('[]') ? 'array' : 'string';
                   
  let propDef = `            ${prop.name}: { 
              type: '${propType}'`;
              
  if (prop.type.includes('|')) {
    const enumValues = prop.type.split('|').map(t => t.trim().replace(/['"]/g, ''));
    propDef += `,
              enum: [${enumValues.map(v => `'${v}'`).join(', ')}]`;
  }
  
  if (propType === 'array') {
    propDef += `,
              items: { 
                type: 'string' 
              }`;
  }
  
  propDef += `
            }`;
  return propDef;
}).join(',\n')}
          }
        },
        StatusUpdate: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { 
              type: 'string'${(() => {
                const statusProp = config.properties.find(p => p.name === 'status' && p.type.includes('|'));
                if (statusProp) {
                  const enumValues = statusProp.type.split('|').map(t => t.trim().replace(/['"]/g, '')).map(v => `'${v}'`).join(', ');
                  return `,\n              enum: [${enumValues}]`;
                }
                return '';
              })()}
            }
          }
        }
      }
    }
  };

  // Add swagger routes
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));
  app.get('/api-spec.json', (req, res) => {
    res.json(spec);
  });
  
  console.log(\`Swagger UI available at http://localhost:3000/api-docs\`);
}`;
}