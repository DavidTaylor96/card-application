// src/swagger.ts
import * as swaggerUi from 'swagger-ui-express';
import express from 'express';
import fs from 'fs';
import path from 'path';

export function setupSwagger(app: express.Express, version?: string, isDefault = true): void {
  // Set up routes for swagger docs
  const versionPath = version ? `/v${version}` : '';
  const docsPath = isDefault ? '/api-docs' : `/api-docs${versionPath}`;
  
  // Try to find a pre-generated OpenAPI spec for this version
  const specDir = path.join(__dirname, 'api-specs');
  let specFile;
  
  if (fs.existsSync(specDir)) {
    if (version) {
      specFile = path.join(specDir, `openapi-v${version}.json`);
    } else {
      // Get the latest version if no specific version provided
      const versionPattern = /openapi-v(\d+)\.json/;
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
      console.log(`Loading Swagger spec from: ${specFile}`);
      const spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));

      // Use middleware with explicit path
      app.use(docsPath, swaggerUi.serve);
      app.get(docsPath, swaggerUi.setup(spec));
      
      // Also serve the spec as JSON
      const specJsonPath = docsPath.replace('/api-docs', '/api-spec') + '.json';
      app.get(specJsonPath, (req: express.Request, res: express.Response) => {
        res.json(spec);
      });
      
      console.log(`Swagger UI for ${version ? 'v' + version : 'latest API'} available at http://localhost:3000${docsPath}`);
      return;
    } catch (error) {
      console.error(`Error loading Swagger spec from ${specFile}:`, error);
    }
  } else {
    console.log(`No spec file found at: ${specFile}`);
  }
  
  // Fall back to dynamic spec generation
  const spec = {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: version || '1.0.0',
      description: `API documentation${version ? ` for version ${version}` : ''}`
    },
    servers: [
      {
        url: `/api${versionPath}`,
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
    ? path.join(specDir, `openapi-v${version}.json`) 
    : path.join(specDir, 'openapi.json');
    
  fs.writeFileSync(outputSpecPath, JSON.stringify(spec, null, 2));
  console.log(`Created fallback spec at: ${outputSpecPath}`);
  
  // Use middleware with explicit path
  app.use(docsPath, swaggerUi.serve);
  app.get(docsPath, swaggerUi.setup(spec));
  
  const specJsonPath = docsPath.replace('/api-docs', '/api-spec') + '.json';
  app.get(specJsonPath, (req: express.Request, res: express.Response) => {
    res.json(spec);
  });
  
  console.log(`Basic Swagger UI for ${version ? 'v' + version : 'API'} available at http://localhost:3000${docsPath}`);
}
