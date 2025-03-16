// src/controllers/healthController.ts
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
    console.log(`Health check request from ${requestIP}`);
    
    // Detect available API versions
    const controllersDir = path.join(__dirname, '../controllers');
    const apiVersions = new Set<string>();
    
    if (fs.existsSync(controllersDir)) {
      const files = fs.readdirSync(controllersDir);
      for (const file of files) {
        const versionMatch = file.match(/Controller[Vv](\d+)/i);
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
