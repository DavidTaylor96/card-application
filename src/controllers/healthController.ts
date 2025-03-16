// src/controllers/healthController.ts
import { JsonController, Get, Req } from 'routing-controllers';
import { Request } from 'express';

@JsonController()
export class HealthController {
  @Get('/health')
  healthCheck(@Req() req: Request) {
    // Log request
    const requestIP = req.ip || 'unknown';
    console.log(`Health check request from ${requestIP}`);
    
    return {
      status: 'OK',
      service: 'card-application-api',
      timestamp: new Date().toISOString()
    };
  }
}
