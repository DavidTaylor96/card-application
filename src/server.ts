// src/server.ts
import 'reflect-metadata';
import express from 'express';
import { createExpressServer } from 'routing-controllers';
import { HealthController } from './controllers/healthController';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

// Automatically load all controllers
const controllersPath = path.join(__dirname, './controllers/**/*Controller.{ts,js}');

const controllers = Object.values(require('require-all')({
  dirname: path.join(__dirname, './controllers'),
  filter: /(.+Controller)\.([jt])s$/,
  recursive: true
}))
.flat()
.filter(controller => typeof controller === 'function');

console.log(`Loaded ${controllers.length} controllers`);

// Create Express server with routing-controllers
const app = createExpressServer({
  controllers: controllers,
  routePrefix: '/api',
  validation: {
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true
  },
  defaultErrorHandler: true
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
});