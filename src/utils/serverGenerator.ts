// src/utils/serverGenerator.ts
import fs from 'fs';
import path from 'path';
import glob from 'glob';

/**
 * Generates server.ts file with automatic controller discovery and API versioning support
 */
export function generateServer(outputPath: string): void {
  const serverCode = `// src/server.ts
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
        console.log(\`Default Swagger UI enabled at http://localhost:\${PORT}/api-docs\`);
      } catch (error) {
        console.error('Error setting up default Swagger UI:', error);
      }
    }
    
    // Version-specific specs
    const versionSpecPattern = /openapi-v(\\d+)\\.json/;
    specFiles.forEach(file => {
      const versionMatch = file.match(versionSpecPattern);
      if (versionMatch && versionMatch[1]) {
        const version = versionMatch[1];
        const versionPath = \`/api-docs/v\${version}\`;
        const specPath = path.join(apiSpecsDir, file);
        
        try {
          const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
          app.use(versionPath, swaggerUi.serve);
          app.get(versionPath, swaggerUi.setup(spec));
          console.log(\`Version \${version} Swagger UI enabled at http://localhost:\${PORT}\${versionPath}\`);
        } catch (error) {
          console.error(\`Error setting up Swagger UI for version \${version}:\`, error);
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
      const versionMatch = file.match(/Controller[Vv](\\d+)/i);
      if (versionMatch && versionMatch[1]) {
        apiVersions.add(versionMatch[1]);
      }
    }
  }
}

console.log(\`Loaded \${controllerClasses.length} controllers\`);
if (apiVersions.size > 0) {
  console.log(\`Detected API versions: \${Array.from(apiVersions).join(', ')}\`);
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
  console.log(\`Health check request from \${requestIP}\`);
  
  res.status(200).json({ 
    status: 'OK', 
    service: 'card-application-api',
    timestamp: new Date().toISOString(),
    apiVersions: Array.from(apiVersions).sort()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
  console.log(\`API Documentation available at http://localhost:\${PORT}/api-docs\`);
});`;

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
    'swagger-ui-express': '^5.0.0',
    'require-all': '^3.0.0',
    'glob': '^8.0.3'
  };
  
  // Merge with existing dependencies
  packageJson.dependencies = { ...packageJson.dependencies, ...dependencies };
  
  // Add dev dependencies
  const devDependencies = {
    '@types/swagger-ui-express': '^4.1.3',
    '@types/glob': '^8.0.0',
    '@types/require-all': '^3.0.3'
  };
  
  // Merge with existing dev dependencies
  packageJson.devDependencies = { ...packageJson.devDependencies, ...devDependencies };
  
  // Add scripts for generating versioned resources
  packageJson.scripts = { 
    ...packageJson.scripts,
    "generate:v1": "npx ts-node scripts/generate-resource.ts --version=1",
    "generate:v2": "npx ts-node scripts/generate-resource.ts --version=2"
  };
  
  // Write updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log(`Updated package.json with required dependencies and version scripts`);
}

/**
 * Generate basic health controller
 */
export function generateHealthController(outputPath: string): void {
  const healthControllerCode = `// src/controllers/healthController.ts
import { JsonController, Get, Req } from 'routing-controllers';
import { Request } from 'express';
import fs from 'fs';
import path from 'path';

@JsonController()
export class HealthController {
  @Get('/health')
  healthCheck(@Req() req: Request) {
    // Log request
    const requestIP = req.ip || 'unknown';
    console.log(\`Health check request from \${requestIP}\`);
    
    // Detect available API versions
    const controllersDir = path.join(__dirname, '../controllers');
    const apiVersions = new Set<string>();
    
    if (fs.existsSync(controllersDir)) {
      const files = fs.readdirSync(controllersDir);
      for (const file of files) {
        const versionMatch = file.match(/Controller[Vv](\\d+)/i);
        if (versionMatch && versionMatch[1]) {
          apiVersions.add(versionMatch[1]);
        }
      }
    }
    
    return {
      status: 'OK',
      service: 'card-application-api',
      timestamp: new Date().toISOString(),
      apiVersions: Array.from(apiVersions).sort()
    };
  }
}
`;

  // Write the health controller file
  fs.writeFileSync(outputPath, healthControllerCode);
  console.log(`Generated health controller at: ${outputPath}`);
}

/**
 * Generate updated Swagger setup with versioning support
 */
export function generateVersionedSwaggerSetup(outputPath: string): void {
  const swaggerSetupCode = `// src/swagger.ts
import * as swaggerUi from 'swagger-ui-express';
import express from 'express';
import fs from 'fs';
import path from 'path';

export function setupSwagger(app: express.Express, version?: string, isDefault = true): void {
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
      } else {
        // If no versioned specs found, try the default one
        specFile = path.join(specDir, 'openapi.json');
      }
    }
  }
  
  // Use the spec if it exists
  if (specFile && fs.existsSync(specFile)) {
    try {
      console.log(\`Loading Swagger spec from: \${specFile}\`);
      const spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));

      // Use middleware with explicit path
      app.use(docsPath, swaggerUi.serve);
      app.get(docsPath, swaggerUi.setup(spec));
      
      // Also serve the spec as JSON
      const specJsonPath = docsPath.replace('/api-docs', '/api-spec') + '.json';
      app.get(specJsonPath, (req: express.Request, res: express.Response) => {
        res.json(spec);
      });
      
      console.log(\`Swagger UI for \${version ? 'v' + version : 'latest API'} available at http://localhost:3000\${docsPath}\`);
      return;
    } catch (error) {
      console.error(\`Error loading Swagger spec from \${specFile}:\`, error);
    }
  } else {
    console.log(\`No spec file found at: \${specFile}\`);
  }
  
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
  
  // Write fallback spec to disk
  if (!fs.existsSync(specDir)) {
    fs.mkdirSync(specDir, { recursive: true });
  }
  
  const outputSpecPath = version 
    ? path.join(specDir, \`openapi-v\${version}.json\`) 
    : path.join(specDir, 'openapi.json');
    
  fs.writeFileSync(outputSpecPath, JSON.stringify(spec, null, 2));
  console.log(\`Created fallback spec at: \${outputSpecPath}\`);
  
  // Use middleware with explicit path
  app.use(docsPath, swaggerUi.serve);
  app.get(docsPath, swaggerUi.setup(spec));
  
  const specJsonPath = docsPath.replace('/api-docs', '/api-spec') + '.json';
  app.get(specJsonPath, (req: express.Request, res: express.Response) => {
    res.json(spec);
  });
  
  console.log(\`Basic Swagger UI for \${version ? 'v' + version : 'API'} available at http://localhost:3000\${docsPath}\`);
}
`;

  // Write the swagger setup file
  fs.writeFileSync(outputPath, swaggerSetupCode);
  console.log(`Generated versioned Swagger setup at: ${outputPath}`);
}


/**
 * Generate a complete server setup with versioning support
 */
export function generateServerSetup(baseDir: string, version?: string): void {
  // Create directories if they don't exist
  const dirs = [
    path.join(baseDir, 'src/controllers'),
    path.join(baseDir, version ? `src/v${version}/controllers` : 'src/controllers'),
    path.join(baseDir, 'src/api-specs')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  // Generate server.ts
  const serverPath = path.join(baseDir, 'src/server.ts');
  generateServer(serverPath);
  
  // Generate health controller in the base controllers directory
  const healthControllerPath = path.join(baseDir, 'src/controllers/healthController.ts');
  generateHealthController(healthControllerPath);
  
  // Generate versioned swagger setup
  const swaggerSetupPath = path.join(baseDir, 'src/swagger.ts');
  generateVersionedSwaggerSetup(swaggerSetupPath);
  
  // Update package.json
  const packageJsonPath = path.join(baseDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    updatePackageJson(packageJsonPath);
  }
  
  console.log(`Server setup completed with API versioning support!`);
}