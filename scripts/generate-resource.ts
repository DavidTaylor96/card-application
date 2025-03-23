#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { ResourceConfig, generateResource } from '../src/utils/resourceGenerator';
import { generateServerSetup } from '../src/utils/serverGenerator';
import { generateSwaggerSetup } from '../src/utils/swaggerGenerator';

// Define command line flags
const args = process.argv.slice(2);
let configPath: string | undefined;
let generateServerConfig = false;
let generateSwaggerConfig = false;
let apiVersion: string | undefined;
let versionedEndpoints = true; // Default to versioned endpoints

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--server' || arg === '-s') {
    generateServerConfig = true;
  } else if (arg === '--swagger' || arg === '-sw') {
    generateSwaggerConfig = true;
  } else if (arg.startsWith('--version=')) {
    apiVersion = arg.split('=')[1];
  } else if (arg === '--version' || arg === '-v') {
    // Check if next arg exists and isn't another flag
    if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
      apiVersion = args[i + 1];
      i++; // Skip the next arg since we consumed it
    }
  } else if (arg === '--no-versioned-endpoints') {
    versionedEndpoints = false;
  } else if (!configPath && !arg.startsWith('-')) {
    configPath = arg;
  }
}

// Display help if needed
if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: generate-resource <config-file.json> [options]');
  console.log('\nOptions:');
  console.log('  --server, -s                     Generate server configuration files');
  console.log('  --swagger, -sw                   Generate Swagger documentation setup');
  console.log('  --version=VERSION, -v VERSION    Specify API version number (e.g., 1, 2)');
  console.log('  --no-versioned-endpoints         Don\'t prefix endpoints with version (e.g., /resource instead of /v1/resource)');
  console.log('  --help, -h                       Show this help message');
  process.exit(0);
}

// Check if a config file path was provided
if (!configPath) {
  console.error('Error: Please provide a path to the resource configuration JSON file');
  console.error('Run with --help for usage information');
  process.exit(1);
}

let config: ResourceConfig;

try {
  // Read and parse the configuration file
  const configJson = fs.readFileSync(configPath, 'utf8');
  config = JSON.parse(configJson);
  
  // Add version to the config if specified
  if (apiVersion) {
    config.version = apiVersion;
    
    // Override version in config file if specified in command line
    console.log(`Using API version: v${apiVersion}`);
    
    // Configure whether to prefix endpoints with version
    if (!versionedEndpoints) {
      console.log('Not using versioned endpoints prefix');
    }
  } else if (config.version) {
    console.log(`Using API version from config: v${config.version}`);
  }
  
  // Store versioned endpoints flag in config
  (config as any).useVersionedEndpoints = versionedEndpoints;
} catch (error: any) {
  console.error(`Error reading configuration file: ${error.message}`);
  process.exit(1);
}

try {
  // Create version directories structure if version is specified
  if (config.version) {
    const baseDir = process.cwd();
    const versionDirs = [
      path.join(baseDir, `src/v${config.version}`),
      path.join(baseDir, `src/v${config.version}/controllers`),
      path.join(baseDir, `src/v${config.version}/services`),
      path.join(baseDir, `src/v${config.version}/models`),
      path.join(baseDir, `src/v${config.version}/models/interfaces`),
    ];
    
    if (config.generateRepository) {
      versionDirs.push(path.join(baseDir, `src/v${config.version}/repositories`));
    }
    
    if (config.generateDtos) {
      versionDirs.push(path.join(baseDir, `src/v${config.version}/dtos`));
    }
    
    // Only create version directories if user wants them
    if (versionedEndpoints) {
      versionDirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          console.log(`Created version directory: ${dir}`);
        }
      });
    }
  }
  
  // Handle versioned paths for endpoints
  if (config.version && versionedEndpoints && !config.basePath.startsWith(`/v${config.version}`)) {
    config.basePath = `/v${config.version}${config.basePath}`;
  }
  
  // Generate all the resource files
  generateResource(config);
  console.log(`Resource ${config.name}${config.version ? ` (v${config.version})` : ''} successfully generated!`);
  
  // Generate server configuration if requested
  if (generateServerConfig) {
    // Pass version info through the config object instead
    generateServerSetup(process.cwd(), config.version);
    console.log(`Server configuration generated with versioning support. Don't forget to run 'npm install' to install the new dependencies!`);
  }
  
  // Generate Swagger setup if requested
  if (generateSwaggerConfig) {
    // Determine appropriate path for swagger setup
    const swaggerDir = path.join(process.cwd(), 'src/api-specs');
    if (!fs.existsSync(swaggerDir)) {
      fs.mkdirSync(swaggerDir, { recursive: true });
    }
    
    // Generate swagger spec file with appropriate version
    const specFileName = config.version ? 
      `openapi-v${config.version}.json` : 
      'openapi.json';
      
    const swaggerPath = path.join(swaggerDir, specFileName);
    
    // Generate the swagger setup (with versioning support)
    // And use it to build a complete OpenAPI spec
    try {
      // Generate full OpenAPI spec with paths and schemas
      const versionPrefix = config.version ? `/v${config.version}` : '';
      const spec = {
        openapi: '3.0.0',
        info: {
          title: `${config.name} API${config.version ? ` (v${config.version})` : ''}`,
          version: config.version || '1.0.0',
          description: `API for managing ${config.name.toLowerCase()}`
        },
        servers: [
          {
            url: `/api${versionPrefix}`,
            description: `API Server${config.version ? ` v${config.version}` : ''}`
          }
        ],
        tags: [
          {
            name: `${config.name}`,
            description: `${config.name} operations${config.version ? ` - API version ${config.version}` : ''}`
          }
        ],
        paths: {
          [`${config.basePath}`]: {
            get: {
              summary: `Get all ${config.name.toLowerCase()}s`,
              tags: [`${config.name}`],
              responses: {
                '200': {
                  description: `List of ${config.name.toLowerCase()}s`,
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: {
                          $ref: `#/components/schemas/${config.name}`
                        }
                      }
                    }
                  }
                }
              }
            },
            post: {
              summary: `Create a new ${config.name.toLowerCase()}`,
              tags: [`${config.name}`],
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      $ref: `#/components/schemas/Create${config.name}`
                    }
                  }
                }
              },
              responses: {
                '201': {
                  description: `${config.name} created successfully`,
                  content: {
                    'application/json': {
                      schema: {
                        $ref: `#/components/schemas/${config.name}`
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
          [`${config.basePath}/{id}`]: {
            get: {
              summary: `Get ${config.name.toLowerCase()} by ID`,
              tags: [`${config.name}`],
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
                  description: `${config.name} details`,
                  content: {
                    'application/json': {
                      schema: {
                        $ref: `#/components/schemas/${config.name}`
                      }
                    }
                  }
                },
                '404': {
                  description: `${config.name} not found`
                }
              }
            },
            patch: {
              summary: `Update ${config.name.toLowerCase()}`,
              tags: [`${config.name}`],
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
                      $ref: `#/components/schemas/Update${config.name}`
                    }
                  }
                }
              },
              responses: {
                '200': {
                  description: `${config.name} updated`,
                  content: {
                    'application/json': {
                      schema: {
                        $ref: `#/components/schemas/${config.name}`
                      }
                    }
                  }
                },
                '404': {
                  description: `${config.name} not found`
                }
              }
            },
            delete: {
              summary: `Delete ${config.name.toLowerCase()}`,
              tags: [`${config.name}`],
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
                  description: `${config.name} deleted`,
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
                  description: `${config.name} not found`
                }
              }
            }
          },
          [`${config.basePath}/{id}/status`]: {
            patch: {
              summary: `Update ${config.name.toLowerCase()} status`,
              tags: [`${config.name}`],
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
                        $ref: `#/components/schemas/${config.name}`
                      }
                    }
                  }
                },
                '404': {
                  description: `${config.name} not found`
                }
              }
            }
          }
        },
        components: {
          schemas: {
            [config.name]: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                ...config.properties.reduce((acc: any, prop) => {
                  const propType = prop.type === 'number' ? 'number' : 
                                  prop.type === 'boolean' ? 'boolean' : 
                                  prop.type.endsWith('[]') ? 'array' : 'string';
                  
                  let propDef: any = {
                    type: propType
                  };
                  
                  if (prop.type.includes('|')) {
                    const enumValues = prop.type
                      .split('|')
                      .map(t => t.trim().replace(/['"]/g, ''));
                    propDef.enum = enumValues;
                  }
                  
                  if (propType === 'array') {
                    propDef.items = { 
                      type: 'string' 
                    };
                  }
                  
                  acc[prop.name] = propDef;
                  return acc;
                }, {}),
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            },
            [`Create${config.name}`]: {
              type: 'object',
              required: config.properties
                .filter(p => p.required !== false)
                .map(p => p.name),
              properties: config.properties.reduce((acc: any, prop) => {
                const propType = prop.type === 'number' ? 'number' : 
                                prop.type === 'boolean' ? 'boolean' : 
                                prop.type.endsWith('[]') ? 'array' : 'string';
                
                let propDef: any = {
                  type: propType
                };
                
                if (prop.type.includes('|')) {
                  const enumValues = prop.type
                    .split('|')
                    .map(t => t.trim().replace(/['"]/g, ''));
                  propDef.enum = enumValues;
                }
                
                if (propType === 'array') {
                  propDef.items = { 
                    type: 'string' 
                  };
                }
                
                acc[prop.name] = propDef;
                return acc;
              }, {})
            },
            [`Update${config.name}`]: {
              type: 'object',
              properties: config.properties.reduce((acc: any, prop) => {
                const propType = prop.type === 'number' ? 'number' : 
                                prop.type === 'boolean' ? 'boolean' : 
                                prop.type.endsWith('[]') ? 'array' : 'string';
                
                let propDef: any = {
                  type: propType
                };
                
                if (prop.type.includes('|')) {
                  const enumValues = prop.type
                    .split('|')
                    .map(t => t.trim().replace(/['"]/g, ''));
                  propDef.enum = enumValues;
                }
                
                if (propType === 'array') {
                  propDef.items = { 
                    type: 'string' 
                  };
                }
                
                acc[prop.name] = propDef;
                return acc;
              }, {})
            },
            StatusUpdate: {
              type: 'object',
              required: ['status'],
              properties: {
                status: (() => {
                  const statusProp = config.properties.find(p => p.name === 'status' && p.type.includes('|'));
                  if (statusProp) {
                    return {
                      type: 'string',
                      enum: statusProp.type
                        .split('|')
                        .map(t => t.trim().replace(/['"]/g, ''))
                    };
                  }
                  return {
                    type: 'string'
                  };
                })()
              }
            }
          }
        }
      };
      
      // Write the spec to file
      fs.writeFileSync(swaggerPath, JSON.stringify(spec, null, 2));
      console.log(`Full Swagger specification generated at ${swaggerPath}`);
    } catch (error) {
      console.error('Error creating Swagger spec:', error);
    }
    
    // Also generate the setup file
    const setupPath = path.join(process.cwd(), 'src/swagger.ts');
    if (!fs.existsSync(setupPath)) {
      // This is a generic swagger setup that loads specs from files
      const setupCode = `// src/swagger.ts
import * as swaggerUi from 'swagger-ui-express';
import express from 'express';
import fs from 'fs';
import path from 'path';

export function setupSwagger(app: express.Express, version?: string, isDefault: boolean = false): void {
  // If no specific version is provided and not the default, do nothing
  if (!version && !isDefault) return;
  
  // Set up routes for swagger docs
  const versionPath = version ? \`/v\${version}\` : '';
  const docsPath = isDefault ? '/api-docs' : \`/api-docs\${versionPath}\`;
  
  // Try to find a pre-generated OpenAPI spec for this version
  const specDir = path.join(__dirname, 'api-specs');
  let specFile;
  
  if (fs.existsSync(specDir)) {
    if (version) {
      specFile = path.join(specDir, \`openapi-v\${version}.json\`);
    } else {
      // Get the latest version if no specific version provided
      const versionPattern = /openapi-v(\\d+)\\.json/;
      const specFiles = fs.readdirSync(specDir)
        .filter(file => versionPattern.test(file))
        .sort((a, b) => {
          const vA = parseInt(a.match(versionPattern)?.[1] || '0');
          const vB = parseInt(b.match(versionPattern)?.[1] || '0');
          return vB - vA; // Sort descending to get latest version first
        });
        
      if (specFiles.length > 0) {
        specFile = path.join(specDir, specFiles[0]);
      }
    }
  }
  
  // Use the spec if it exists
  if (specFile && fs.existsSync(specFile)) {
    const spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));
    app.use(docsPath, swaggerUi.serve);
    app.get(docsPath, swaggerUi.setup(spec));
    
    // Also serve the spec as JSON
    const specJsonPath = docsPath.replace('/api-docs', '/api-spec') + '.json';
    app.get(specJsonPath, (req: express.Request, res: express.Response) => {
      res.json(spec);
    });
    
    console.log(\`Swagger UI for \${version ? 'v' + version : 'latest API'} available at http://localhost:3000\${docsPath}\`);
  } else {
    // Fall back to dynamic spec generation
    const spec = {
      openapi: '3.0.0',
      info: {
        title: 'API Documentation',
        version: version || '1.0.0',
        description: \`API documentation\${version ? \` for version \${version}\` : ''}\`
      },
      servers: [
        {
          url: \`/api\${versionPath}\`,
          description: 'API Server'
        }
      ],
      paths: {},
      components: {
        schemas: {}
      }
    };
    
    app.use(docsPath, swaggerUi.serve);
    app.get(docsPath, swaggerUi.setup(spec));
    
    const specJsonPath = docsPath.replace('/api-docs', '/api-spec') + '.json';
    app.get(specJsonPath, (req: express.Request, res: express.Response) => {
      res.json(spec);
    });
    
    console.log(\`Basic Swagger UI for \${version ? 'v' + version : 'API'} available at http://localhost:3000\${docsPath}\`);
  }
}`;
      
      fs.writeFileSync(setupPath, setupCode);
      console.log(`Swagger setup with versioning support generated at ${setupPath}`);
    } else {
      console.log(`Swagger setup file already exists at ${setupPath}`);
    }
    
    if (!generateServerConfig) {
      console.log("Note: You should update your server.ts to include Swagger setup:");
      console.log("1. Import: import { setupSwagger } from './swagger';");
      console.log("2. Add: setupSwagger(app); after creating your Express app");
    }
  }

  // Final instructions and version summary
  if (config.version) {
    console.log('\n--- API Version Summary ---');
    console.log(`API Version: v${config.version}`);
    console.log(`Base Path: ${config.basePath}`);
    if (generateSwaggerConfig) {
      console.log(`Documentation URL: /api-docs/v${config.version}`);
    }
    console.log('------------------------');
  }

} catch (error: any) {
  console.error(`Error generating resource: ${error.message}`);
  process.exit(1);
}