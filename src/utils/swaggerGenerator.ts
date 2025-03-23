import { ResourceConfig } from './resourceGenerator';

/**
 * Checks if an endpoint is targeting a specific field update
 */
function getSpecializedFieldEndpoints(endpoints: any[]): string[] {
  const specializedFields: string[] = [];
  
  endpoints.forEach(endpoint => {
    const match = endpoint.path.match(/\/:id\/([a-zA-Z0-9_]+)$/);
    if (match && match[1] && match[1] !== 'status') {
      specializedFields.push(match[1]);
    }
  });
  
  return [...new Set(specializedFields)]; // Remove duplicates
}

/**
 * Generates Swagger setup code
 */
export function generateSwaggerSetup(config: ResourceConfig): string {
  // Get specialized field endpoints
  const specializedFields = getSpecializedFieldEndpoints(config.endpoints);

  return `// src/swagger.ts
import * as swaggerUi from 'swagger-ui-express';
import express from 'express';
import fs from 'fs';
import path from 'path';

export function setupSwagger(app: express.Express, version?: string, isDefault: boolean = false): void {
  // If no specific version is provided and not the default, generate specs for the current config
  const currentVersion = ${config.version ? `'${config.version}'` : 'undefined'};
  const specVersion = version || currentVersion || '1';
  
  // Determine the appropriate path for docs
  const versionPath = version ? \`/v\${version}\` : '';
  const docsPath = isDefault ? '/api-docs' : \`/api-docs\${versionPath}\`;
  
  // Create OpenAPI spec from resource config
  const spec = {
    openapi: '3.0.0',
    info: {
      title: '${config.name} API' + (version ? \` (v\${specVersion})\` : ''),
      version: specVersion || '1.0.0',
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
        name: '${config.name}' + (version ? \` v\${specVersion}\` : ''),
        description: '${config.name} operations' + (version ? \` - API version \${specVersion}\` : '')
      }
    ],
    paths: {
      [versionPath + '${config.basePath}']: {
        get: {
          summary: 'Get all ${config.name.toLowerCase()}s',
          tags: ['${config.name}' + (version ? \` v\${specVersion}\` : '')],
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
          tags: ['${config.name}' + (version ? \` v\${specVersion}\` : '')],
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
      [versionPath + '${config.basePath}/{id}']: {
        get: {
          summary: 'Get ${config.name.toLowerCase()} by ID',
          tags: ['${config.name}' + (version ? \` v\${specVersion}\` : '')],
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
          tags: ['${config.name}' + (version ? \` v\${specVersion}\` : '')],
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
          tags: ['${config.name}' + (version ? \` v\${specVersion}\` : '')],
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
      [versionPath + '${config.basePath}/{id}/status']: {
        patch: {
          summary: 'Update ${config.name.toLowerCase()} status',
          tags: ['${config.name}' + (version ? \` v\${specVersion}\` : '')],
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
      },
      ${specializedFields.map(field => {
        const fieldProperty = config.properties.find(p => p.name === field);
        if (!fieldProperty) return '';
        
        return `[versionPath + '${config.basePath}/{id}/${field}']: {
        patch: {
          summary: 'Update ${config.name.toLowerCase()} ${field}',
          tags: ['${config.name}' + (version ? \` v\${specVersion}\` : '')],
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
                  type: 'object',
                  properties: {
                    ${field}: {
                      type: '${fieldProperty.type === 'number' ? 'number' : fieldProperty.type === 'boolean' ? 'boolean' : 'string'}'
                      ${fieldProperty.type.includes('|') ? `,
                      enum: [${fieldProperty.type.split('|').map(t => t.trim().replace(/['"]/g, '')).map(v => `'${v}'`).join(', ')}]` : ''}
                    }
                  },
                  required: ['${field}']
                }
              }
            }
          },
          responses: {
            '200': {
              description: '${field} updated',
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
      }`;
      }).join(',\n      ')}
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
                  return `,
              enum: [${enumValues}]`;
                }
                return '';
              })()}
            }
          }
        }
      }
    }
  };
  
  // Write to disk if specified
  const specDir = path.join(process.cwd(), 'src/api-specs');
  if (!fs.existsSync(specDir)) {
    fs.mkdirSync(specDir, { recursive: true });
  }
  
  const specFile = path.join(specDir, \`openapi-\${versionPath || 'v1'}.json\`);
  fs.writeFileSync(specFile, JSON.stringify(spec, null, 2));
  console.log(\`Wrote OpenAPI spec to \${specFile}\`);
  
  // Add swagger routes
  app.use(docsPath, swaggerUi.serve, swaggerUi.setup(spec));
  
  // Add a route to get the OpenAPI spec as JSON
  const specPath = docsPath.replace('/api-docs', '/api-spec') + '.json';
  app.get(specPath, (req, res) => {
    res.json(spec);
  });
  
  console.log(\`Swagger UI available at \${docsPath}\`);
}`;
}