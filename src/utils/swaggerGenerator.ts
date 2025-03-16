import { ResourceConfig } from './resourceGenerator';

/**
 * Generates Swagger setup code
 */
export function generateSwaggerSetup(config: ResourceConfig): string {
  const version = config.version ? `v${config.version}` : '';
  const versionedBasePath = version ? `/${version}${config.basePath}` : config.basePath;

  return `// src/swagger.ts
import * as swaggerUi from 'swagger-ui-express';
import express from 'express';

export function setupSwagger(app: express.Express): void {
  // Create manual OpenAPI spec directly from resource config
  const spec = {
    openapi: '3.0.0',
    info: {
      title: '${config.name} API${config.version ? ` (v${config.version})` : ''}',
      version: '${config.version || '1.0.0'}',
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
        name: '${config.name}${config.version ? ` v${config.version}` : ''}',
        description: '${config.name} operations${config.version ? ` - API version ${config.version}` : ''}'
      }
    ],
    paths: {
      '${versionedBasePath}': {
        get: {
          summary: 'Get all ${config.name.toLowerCase()}s',
          tags: ['${config.name}${config.version ? ` v${config.version}` : ''}'],
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
          tags: ['${config.name}${config.version ? ` v${config.version}` : ''}'],
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
      '${versionedBasePath}/{id}': {
        get: {
          summary: 'Get ${config.name.toLowerCase()} by ID',
          tags: ['${config.name}${config.version ? ` v${config.version}` : ''}'],
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
          tags: ['${config.name}${config.version ? ` v${config.version}` : ''}'],
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
          tags: ['${config.name}${config.version ? ` v${config.version}` : ''}'],
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
      '${versionedBasePath}/{id}/status': {
        patch: {
          summary: 'Update ${config.name.toLowerCase()} status',
          tags: ['${config.name}${config.version ? ` v${config.version}` : ''}'],
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

  // Add swagger routes with version in the path if applicable
  const docsPath = ${config.version ? `'/api-docs${version}'` : `'/api-docs'`};
  app.use(docsPath, swaggerUi.serve, swaggerUi.setup(spec));
  
  // Add a route to get the OpenAPI spec as JSON
  const specPath = ${config.version ? `'/api-spec${version}.json'` : `'/api-spec.json'`};
  app.get(specPath, (req, res) => {
    res.json(spec);
  });
  
  console.log(\`Swagger UI available at http://localhost:3000\${docsPath}\`);
}`;
}