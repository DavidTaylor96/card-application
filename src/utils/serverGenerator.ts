// src/utils/serverGenerator.ts
import fs from 'fs';
import path from 'path';
import glob from 'glob';

/**
 * Generates server.ts file with automatic controller discovery
 */
export function generateServer(outputPath: string): void {
  const serverCode = `// src/server.ts
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
})).flat();

console.log(\`Loaded \${controllers.length} controllers\`);

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
  console.log(\`Health check request from \${requestIP}\`);
  
  res.status(200).json({ 
    status: 'OK', 
    service: 'card-application-api',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`;

  // Write the server.ts file
  fs.writeFileSync(outputPath, serverCode);
  console.log(`Generated server configuration at: ${outputPath}`);
}

/**
 * Updates package.json with required dependencies for automatic controller discovery
 */
export function updatePackageJson(packageJsonPath: string): void {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add required dependencies
  const dependencies = {
    'reflect-metadata': '^0.1.13',
    'routing-controllers': '^0.10.0',
    'class-validator': '^0.14.0',
    'class-transformer': '^0.5.1',
    'require-all': '^3.0.0',
    'glob': '^8.0.3'
  };
  
  // Merge with existing dependencies
  packageJson.dependencies = { ...packageJson.dependencies, ...dependencies };
  
  // Add dev dependencies
  const devDependencies = {
    '@types/glob': '^8.0.0',
    '@types/require-all': '^3.0.3'
  };
  
  // Merge with existing dev dependencies
  packageJson.devDependencies = { ...packageJson.devDependencies, ...devDependencies };
  
  // Write updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log(`Updated package.json with required dependencies`);
}

/**
 * Generate basic health controller
 */
export function generateHealthController(outputPath: string): void {
  const healthControllerCode = `// src/controllers/healthController.ts
import { JsonController, Get, Req } from 'routing-controllers';
import { Request } from 'express';

@JsonController()
export class HealthController {
  @Get('/health')
  healthCheck(@Req() req: Request) {
    // Log request
    const requestIP = req.ip || 'unknown';
    console.log(\`Health check request from \${requestIP}\`);
    
    return {
      status: 'OK',
      service: 'card-application-api',
      timestamp: new Date().toISOString()
    };
  }
}
`;

  // Write the health controller file
  fs.writeFileSync(outputPath, healthControllerCode);
  console.log(`Generated health controller at: ${outputPath}`);
}

/**
 * Generate a complete server setup
 */
export function generateServerSetup(baseDir: string): void {
  // Create directories if they don't exist
  const controllersDir = path.join(baseDir, 'src/controllers');
  if (!fs.existsSync(controllersDir)) {
    fs.mkdirSync(controllersDir, { recursive: true });
  }
  
  // Generate server.ts
  const serverPath = path.join(baseDir, 'src/server.ts');
  generateServer(serverPath);
  
  // Generate health controller
  const healthControllerPath = path.join(baseDir, 'src/controllers/healthController.ts');
  generateHealthController(healthControllerPath);
  
  // Update package.json
  const packageJsonPath = path.join(baseDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    updatePackageJson(packageJsonPath);
  }
  
  console.log(`Server setup completed!`);
}