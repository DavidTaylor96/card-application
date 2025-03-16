#!/usr/bin/env node
// scripts/generate-resource.ts

import fs from 'fs';
import path from 'path';
import { ResourceConfig, generateResource } from '../src/utils/resourceGenerator';
import { generateServerSetup } from '../src/utils/serverGenerator';

// Define command line flags
const args = process.argv.slice(2);
let configPath: string | undefined;
let generateServerConfig = false;

// Parse command line arguments
for (const element of args) {
  if (element === '--server' || element === '-s') {
    generateServerConfig = true;
  } else if (!configPath) {
    configPath = element;
  }
}

// Check if a config file path was provided
if (!configPath) {
  console.error('Please provide a path to the resource configuration JSON file');
  console.error('Usage: generate-resource.ts <config-file.json> [--server]');
  console.error('Options:');
  console.error('  --server, -s   Generate server configuration files');
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
} catch (error: any) {
  console.error(`Error generating resource: ${error.message}`);
  process.exit(1);
}