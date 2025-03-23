// src/server.ts
import 'reflect-metadata';
import express from 'express';
import { createExpressServer } from 'routing-controllers';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import * as swaggerUi from 'swagger-ui-express';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express(); // Create the base Express app first

// Test endpoint to verify basic Express setup
app.get('/test', (req, res) => {
  res.json({ message: 'Express server is working' });
});

// Setup direct Swagger access before controllers
const apiSpecsDir = path.join(__dirname, 'api-specs');
if (fs.existsSync(apiSpecsDir)) {
  const specFiles = fs.readdirSync(apiSpecsDir)
    .filter(file => file.endsWith('.json'))
    .sort();

  if (specFiles.length > 0) {
    // Default spec (use first one found if no version-specific ones)
    const defaultSpec = specFiles.find(f => f === 'openapi.json') || specFiles[0];
    const defaultSpecPath = path.join(apiSpecsDir, defaultSpec);
    
    if (fs.existsSync(defaultSpecPath)) {
      try {
        const spec = JSON.parse(fs.readFileSync(defaultSpecPath, 'utf8'));
        app.use('/api-docs', swaggerUi.serve);
        app.get('/api-docs', swaggerUi.setup(spec));
        console.log(`Default Swagger UI enabled at http://localhost:${PORT}/api-docs`);
      } catch (error) {
        console.error('Error setting up default Swagger UI:', error);
      }
    }
    
    // Version-specific specs
    const versionSpecPattern = /openapi-v(\d+)\.json/;
    specFiles.forEach(file => {
      const versionMatch = file.match(versionSpecPattern);
      if (versionMatch && versionMatch[1]) {
        const version = versionMatch[1];
        const versionPath = `/api-docs/v${version}`;
        const specPath = path.join(apiSpecsDir, file);
        
        try {
          const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
          app.use(versionPath, swaggerUi.serve);
          app.get(versionPath, swaggerUi.setup(spec));
          console.log(`Version ${version} Swagger UI enabled at http://localhost:${PORT}${versionPath}`);
        } catch (error) {
          console.error(`Error setting up Swagger UI for version ${version}:`, error);
        }
      }
    });
  }
}

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

// Only set up routing-controllers if we have controllers
if (controllerClasses.length > 0) {
  // Create Express server with routing-controllers and merge with our base app
  const routingControllersApp = createExpressServer({
    controllers: controllerClasses,
    routePrefix: '/api',
    validation: {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true
    },
    defaultErrorHandler: true
  });
  
  // Copy all routes from routing-controllers to our base app
  app._router.stack = [...app._router.stack, ...routingControllersApp._router.stack];
} else {
  console.log('No controllers found. Skipping routing-controllers setup.');
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