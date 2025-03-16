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

// Parse command line arguments
for (const element of args) {
  if (element === '--server' || element === '-s') {
    generateServerConfig = true;
  } else if (element === '--swagger' || element === '-sw') {
    generateSwaggerConfig = true;
  } else if (!configPath) {
    configPath = element;
  }
}

// Check if a config file path was provided
if (!configPath) {
  console.error('Please provide a path to the resource configuration JSON file');
  console.error('Usage: generate-resource.ts <config-file.json> [--server] [--swagger]');
  console.error('Options:');
  console.error('  --server, -s    Generate server configuration files');
  console.error('  --swagger, -sw  Generate Swagger documentation setup');
  process.exit(1);
}

let config: ResourceConfig;

try {
  // Read and parse the configuration file
  const configJson = fs.readFileSync(configPath, 'utf8');
  config = JSON.parse(configJson);
} catch (error: any) {
  console.error(`Error reading configuration file: ${error.message}`);
  process.exit(1);
}

try {
  // Generate all the resource files
  generateResource(config);
  console.log(`Resource ${config.name} successfully generated!`);
  
  // Generate server configuration if requested
  if (generateServerConfig) {
    generateServerSetup(process.cwd());
    console.log(`Server configuration generated. Don't forget to run 'npm install' to install the new dependencies!`);
  }
  
  // Generate Swagger setup if requested
  if (generateSwaggerConfig) {
    const swaggerPath = path.join(process.cwd(), 'src/swagger.ts');
    fs.writeFileSync(swaggerPath, generateSwaggerSetup(config));
    console.log(`Swagger documentation setup generated at ${swaggerPath}`);
    
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