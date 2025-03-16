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

// Manually load controllers
const controllersPath = path.join(__dirname, 'controllers');
const controllerClasses: Function[] = [];

// Check if controllers directory exists
if (fs.existsSync(controllersPath)) {
  // Read controller files
  const files = fs.readdirSync(controllersPath)
    .filter(file => file.endsWith('Controller.ts') || file.endsWith('Controller.js'));
  
  // Load each controller
  for (const file of files) {
    const controller = require(path.join(controllersPath, file));
    
    // Find the controller class in the exports
    const controllerClass = Object.values(controller).find(
      exp => typeof exp === 'function' && exp.name.endsWith('Controller')
    );
    
    if (controllerClass && typeof controllerClass === 'function') {
      controllerClasses.push(controllerClass);
    }
  }
}

console.log(`Loaded ${controllerClasses.length} controllers`);

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

// Only setup Swagger if we have controllers
if (controllerClasses.length > 0) {
  try {
    const { setupSwagger } = require('./swagger');
    setupSwagger(app);
    console.log('Swagger documentation enabled at http://localhost:' + PORT + '/api-docs');
  } catch (error: any) {
    console.error('Failed to setup Swagger:', error.message);
  }
}

console.log('Controller classes:', controllerClasses.map(c => c.name));


// Add this after setting up all routes in server.ts
app._router.stack.forEach((middleware: any) => {
  if (middleware.route) {
    console.log(`Route: ${Object.keys(middleware.route.methods)} ${middleware.route.path}`);
  }
});


// Basic health check endpoint outside of API prefix
app.get('/health', (req: express.Request, res: express.Response) => {
  const requestIP = req.ip || 'unknown';
  console.log(`Health check request from ${requestIP}`);
  
  res.status(200).json({ 
    status: 'OK', 
    service: 'card-application-api',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
});