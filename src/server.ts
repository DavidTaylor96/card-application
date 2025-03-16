// src/server.ts
import 'reflect-metadata';
import express from 'express';
import { createExpressServer } from 'routing-controllers';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

// Manually load controllers with versioning support
const controllersPath = path.join(__dirname, 'controllers');
const controllerClasses: Function[] = [];
const apiVersions: Set<string> = new Set();

// Check if controllers directory exists
if (fs.existsSync(controllersPath)) {
  // Read controller files
  const files = fs.readdirSync(controllersPath)
    .filter(file => file.endsWith('Controller.ts') || file.endsWith('Controller.js'));
  
  // Load each controller and detect versions
  for (const file of files) {
    const controller = require(path.join(controllersPath, file));
    
    // Find the controller class in the exports
    const controllerClass = Object.values(controller).find(
      exp => typeof exp === 'function' && exp.name.endsWith('Controller')
    );
    
    if (controllerClass && typeof controllerClass === 'function') {
      controllerClasses.push(controllerClass);
      
      // Check for version in file name (e.g., userControllerV1.ts)
      const versionMatch = file.match(/Controller[Vv](\d+)/i);
      if (versionMatch && versionMatch[1]) {
        apiVersions.add(versionMatch[1]);
      }
    }
  }
}

console.log(`Loaded ${controllerClasses.length} controllers`);
if (apiVersions.size > 0) {
  console.log(`Detected API versions: ${Array.from(apiVersions).join(', ')}`);
}

// Create Express server with routing-controllers
const app = createExpressServer({
  controllers: controllerClasses,
  routePrefix: '/api',
  validation: {
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true
  },
  defaultErrorHandler: true
});

// Setup Swagger documentation for each version
if (controllerClasses.length > 0) {
  try {
    // If we have versions, set up separate swagger docs for each version
    if (apiVersions.size > 0) {
      Array.from(apiVersions).forEach(version => {
        try {
          const { setupSwagger } = require('./swagger');
          // Pass the version to swagger setup
          setupSwagger(app, version);
          console.log(`Swagger documentation for v${version} enabled at http://localhost:${PORT}/api-docs/v${version}`);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Failed to setup Swagger for version ${version}:`, errorMessage);
        }
      });
      
      // Also set up the default latest version for /api-docs
      const latestVersion = Array.from(apiVersions).sort().pop();
      if (latestVersion) {
        const { setupSwagger } = require('./swagger');
        setupSwagger(app, latestVersion, true); // true indicates this is the default
        console.log(`Latest API (v${latestVersion}) documentation available at http://localhost:${PORT}/api-docs`);
      }
    } else {
      // No versions detected, just set up the default swagger
      const { setupSwagger } = require('./swagger');
      setupSwagger(app);
      console.log(`Swagger documentation enabled at http://localhost:${PORT}/api-docs`);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to setup Swagger:', errorMessage);
  }
}

// Version info endpoint
app.get('/api/versions', (req: express.Request, res: express.Response) => {
  const versions = Array.from(apiVersions).sort();
  res.json({
    versions,
    latest: versions.length > 0 ? versions[versions.length - 1] : '1'
  });
});

// Basic health check endpoint outside of API prefix
app.get('/health', (req: express.Request, res: express.Response) => {
  const requestIP = req.ip || 'unknown';
  console.log(`Health check request from ${requestIP}`);
  
  res.status(200).json({ 
    status: 'OK', 
    service: 'card-application-api',
    timestamp: new Date().toISOString(),
    apiVersions: Array.from(apiVersions).sort()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
});