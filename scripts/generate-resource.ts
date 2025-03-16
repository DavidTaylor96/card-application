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
  } else if (!configPath && !arg.startsWith('-')) {
    configPath = arg;
  }
}

// Check if a config file path was provided
if (!configPath) {
  console.error('Please provide a path to the resource configuration JSON file');
  console.error('Usage: generate-resource.ts <config-file.json> [--server] [--swagger] [--version=VERSION]');
  console.error('Options:');
  console.error('  --server, -s              Generate server configuration files');
  console.error('  --swagger, -sw            Generate Swagger documentation setup');
  console.error('  --version=VERSION, -v VERSION    Specify API version number (e.g., 1, 2)');
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
  }
} catch (error: any) {
  console.error(`Error reading configuration file: ${error.message}`);
  process.exit(1);
}

try {
  // Generate all the resource files
  generateResource(config);
  console.log(`Resource ${config.name}${config.version ? ` (v${config.version})` : ''} successfully generated!`);
  
  // Generate server configuration if requested
  if (generateServerConfig) {
    generateServerSetup(process.cwd());
    console.log(`Server configuration generated with versioning support. Don't forget to run 'npm install' to install the new dependencies!`);
  }
  
  // Generate Swagger setup if requested
  if (generateSwaggerConfig) {
    // Determine appropriate path for swagger setup
    const swaggerDir = path.join(process.cwd(), 'src/api-specs');
    if (!fs.existsSync(swaggerDir)) {
      fs.mkdirSync(swaggerDir, { recursive: true });
    }
    
    // Generate swagger spec file
    const specFileName = config.version ? 
      `openapi-v${config.version}.json` : 
      'openapi.json';
      
    const swaggerPath = path.join(swaggerDir, specFileName);
    
    // Generate the swagger setup (modified to support versioning)
    const swaggerCode = generateSwaggerSetup(config);
    
    // Extract the spec JSON from the generated code
    const specMatch = swaggerCode.match(/const\s+spec\s*=\s*({[\s\S]*?});/);
    if (specMatch && specMatch[1]) {
      try {
        // Format the spec JSON and write it to file
        const specJson = eval(`(${specMatch[1]})`); // Safe in this context as we control the source
        fs.writeFileSync(swaggerPath, JSON.stringify(specJson, null, 2));
        console.log(`Swagger specification generated at ${swaggerPath}`);
      } catch (error) {
        console.error('Error extracting Swagger spec:', error);
      }
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

export function setupSwagger(app: express.Express): void {
  // Load all OpenAPI spec files from the api-specs directory
  const specsDir = path.join(__dirname, 'api-specs');
  
  if (fs.existsSync(specsDir)) {
    const specFiles = fs.readdirSync(specsDir)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(specsDir, file));
    
    if (specFiles.length === 0) {
      console.warn('No OpenAPI spec files found in api-specs directory');
      return;
    }
    
    // Set up a route for each version
    specFiles.forEach(specFile => {
      try {
        const specContent = fs.readFileSync(specFile, 'utf8');
        const spec = JSON.parse(specContent);
        
        // Extract version from filename (openapi-v1.json -> v1)
        const versionMatch = path.basename(specFile).match(/openapi-(v\\d+)\.json/);
        const versionPath = versionMatch ? \`/api-docs/\${versionMatch[1]}\` : '/api-docs';
        
        // Serve the Swagger UI for this version
        app.use(versionPath, swaggerUi.serve, swaggerUi.setup(spec, {
          swaggerOptions: {
            docExpansion: 'list'
          }
        }));
        
        // Also provide the raw JSON
        app.get(\`\${versionPath}.json\`, (req, res) => {
          res.json(spec);
        });
        
        console.log(\`Swagger UI for \${path.basename(specFile)} available at \${versionPath}\`);
      } catch (error) {
        console.error(\`Error setting up Swagger for \${specFile}:\`, error);
      }
    });
    
    // If we have multiple versions, create an index page
    if (specFiles.length > 1) {
      app.get('/api-docs', (req, res) => {
        const versionLinks = specFiles.map(file => {
          const versionMatch = path.basename(file).match(/openapi-(v\\d+)\.json/);
          const version = versionMatch ? versionMatch[1] : 'default';
          return \`<li><a href="/api-docs/\${version}">\${version}</a></li>\`;
        });
        
        res.send(\`
          <!DOCTYPE html>
          <html>
          <head>
            <title>API Documentation</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; }
              ul { list-style-type: none; padding: 0; }
              li { margin: 10px 0; }
              a { color: #0366d6; text-decoration: none; }
              a:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <h1>API Documentation Versions</h1>
            <ul>
              \${versionLinks.join('')}
            </ul>
          </body>
          </html>
        \`);
      });
    }
  } else {
    console.warn('api-specs directory not found - Swagger documentation not available');
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
} catch (error: any) {
  console.error(`Error generating resource: ${error.message}`);
  process.exit(1);
}