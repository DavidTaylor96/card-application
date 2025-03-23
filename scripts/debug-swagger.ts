// src/scripts/debug-swagger.ts
// Run this with: npx ts-node src/scripts/debug-swagger.ts

import express from 'express';
import path from 'path';
import fs from 'fs';

// Create a simple Express app for testing
const app = express();

// Define a debug function
async function debugSwagger() {
  // Check if api-specs directory exists
  const specsDir = path.join(process.cwd(), 'src/api-specs');
  console.log(`Checking for specs directory: ${specsDir}`);
  if (!fs.existsSync(specsDir)) {
    console.error(`ERROR: Directory ${specsDir} doesn't exist!`);
    return;
  }

  // List all files in the api-specs directory
  console.log('\nFiles in api-specs directory:');
  const files = fs.readdirSync(specsDir);
  files.forEach(file => console.log(`- ${file}`));

  // Check if swagger.ts exists
  const swaggerPath = path.join(process.cwd(), 'src/swagger.ts');
  console.log(`\nChecking for swagger.ts: ${swaggerPath}`);
  if (!fs.existsSync(swaggerPath)) {
    console.error(`ERROR: File ${swaggerPath} doesn't exist!`);
    return;
  }
  console.log('swagger.ts exists');

  // Try to import the setupSwagger function
  try {
    console.log('\nTrying to import setupSwagger function...');
    // Dynamic import to avoid TypeScript errors
    const { setupSwagger } = require(swaggerPath);
    
    if (typeof setupSwagger !== 'function') {
      console.error('ERROR: setupSwagger is not a function!');
      console.log('Type:', typeof setupSwagger);
      return;
    }
    
    console.log('setupSwagger function imported successfully');
    
    // Test calling the function
    console.log('\nTrying to call setupSwagger...');
    setupSwagger(app);
    
    // If we get here, it worked
    console.log('setupSwagger called successfully');
    
    // Log the registered routes
    console.log('\nRegistered routes:');
    
    // @ts-ignore: This is Express internal API but useful for debugging
    const routes = app._router?.stack?.filter((r: any) => r.route)
      .map((r: any) => { 
        return {
          path: r.route?.path,
          methods: r.route?.methods ? Object.keys(r.route.methods) : []
        };
      });
    
    if (routes && routes.length) {
      routes.forEach((r: any) => console.log(`- ${r.methods.join(', ').toUpperCase()}: ${r.path}`));
    } else {
      console.log('No routes were registered');
    }
    
  } catch (error) {
    console.error('ERROR importing or calling setupSwagger:');
    console.error(error);
  }
}

// Run the debug function
debugSwagger().then(() => {
  console.log('\nDebug complete');
});