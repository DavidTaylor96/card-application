import { EntityProperty } from "./resourceGenerator";

// Define types for endpoint configuration
export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';
  
export interface EndpointConfig {
  method: HttpMethod;
  path: string;
  handler: string;
  statusCode?: number;
  enableLogging?: boolean;
  description?: string;
}
  
export interface ControllerConfig {
  name: string;
  basePath: string;
  endpoints: EndpointConfig[];
  serviceName: string;
  serviceImportPath: string;
}

/**
 * Generates controller class code as a string based on configuration
 */
export function generateControllerCode(config: ControllerConfig & { properties?: EntityProperty[] }): string {
  const { name, basePath, endpoints, serviceName, serviceImportPath, properties } = config;
  
  // Convert entity name to proper camelCase for variables
  const entityNameCamelCase = name.charAt(0).toLowerCase() + name.slice(1);
  
  // Check if we have a status property with a union type
  const statusProperty = properties?.find(p => p.name === 'status' && p.type.includes('|'));
  const hasStatusType = !!statusProperty;
  
  // Start building the controller class
  let code = `
import { 
  JsonController, 
  Get, 
  Post, 
  Put, 
  Patch, 
  Delete,
  Param, 
  Body, 
  QueryParams,
  HttpCode, 
  NotFoundError 
} from 'routing-controllers';
import { Log } from '../decorators/log.decorator';
import { OpenAPI } from 'routing-controllers-openapi';
import { ${serviceName} } from '${serviceImportPath}';

// Import entity and DTOs
import { ${name}${hasStatusType ? `, ${name}Status` : ''} } from '../models/interfaces/${entityNameCamelCase.toLowerCase()}.interface';
import { Create${name}Dto, Update${name}Dto } from '../dtos/${entityNameCamelCase.toLowerCase()}Dto';

/**
 * ${name} - API Controller
 * Generated automatically
 */
@JsonController('${basePath}')
export class ${name}Controller {
  private ${entityNameCamelCase}Service: ${serviceName};
  
  constructor() {
    this.${entityNameCamelCase}Service = new ${serviceName}();
  }
`;

  // Generate methods for each endpoint
  endpoints.forEach(endpoint => {
    const { method, path, handler, statusCode, enableLogging, description } = endpoint;
    
    // Add JSDoc if description is provided
    if (description) {
      code += `
  /**
   * ${description}
   */`;
    }
    
    // Add OpenAPI decorator
    const isStatusUpdate = path.includes('status');
    code += `
  @OpenAPI({
    summary: '${description || handler}',
    description: '${description || ''}',
    responses: {
      ${statusCode || (method === 'post' ? '201' : '200')}: { description: 'Success' },
      400: { description: 'Bad Request' },
      404: { description: 'Not Found' },
      500: { description: 'Internal Server Error' }
    }${isStatusUpdate && statusProperty ? `,
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: [${statusProperty.type.split('|').map(t => t.trim().replace(/['"]/g, '')).map(v => `'${v}'`).join(', ')}]
              }
            },
            required: ['status']
          }
        }
      }
    }` : ''}
  })`;
    
    // Add logging decorator if enabled
    if (enableLogging) {
      code += `
  @Log()`;
    }
    
    // Add HTTP method decorator
    const decoratorMethod = method.charAt(0).toUpperCase() + method.slice(1);
    code += `
  @${decoratorMethod}('${path}')`;
    
    // Add status code decorator if specified
    if (statusCode) {
      code += `
  @HttpCode(${statusCode})`;
    }
    
    // Extract parameter name from path if it contains a parameter
    let paramName = '';
    if (path.includes(':')) {
      // Extract just the parameter name without any special characters
      const paramMatch = path.match(/\/:([^\/]+)/);
      if (paramMatch && paramMatch[1]) {
        paramName = paramMatch[1];
      }
    }
    
    // Add method implementation with appropriate types
    if (method === 'get' && paramName) {
      // Get by ID endpoint
      code += `
  async ${handler}(@Param('${paramName}') ${paramName}: string): Promise<${name}> {
    const result = await this.${entityNameCamelCase}Service.getById(${paramName});
    
    if (!result) {
      throw new NotFoundError('Resource not found');
    }
    
    return result;
  }`;
    } else if (method === 'get') {
      // Get all endpoint
      code += `
  async ${handler}(@QueryParams() params: any): Promise<${name}[]> {
    return await this.${entityNameCamelCase}Service.getAll(params);
  }`;
    } else if (method === 'post') {
      // Create endpoint
      code += `
  async ${handler}(@Body() data: Create${name}Dto): Promise<${name}> {
    return await this.${entityNameCamelCase}Service.create(data);
  }`;
    } else if ((method === 'put' || method === 'patch') && isStatusUpdate) {
      // Status update endpoint with proper status type
      code += `
  async ${handler}(@Param('${paramName}') ${paramName}: string, @Body() data: { status: ${hasStatusType ? `${name}Status` : 'string'} }): Promise<${name}> {
    const result = await this.${entityNameCamelCase}Service.updateStatus(${paramName}, data.status);
    
    if (!result) {
      throw new NotFoundError('Resource not found');
    }
    
    return result;
  }`;
    } else if (method === 'put' || method === 'patch') {
      // Update endpoint
      code += `
  async ${handler}(@Param('${paramName}') ${paramName}: string, @Body() data: Update${name}Dto): Promise<${name}> {
    const result = await this.${entityNameCamelCase}Service.update(${paramName}, data);
    
    if (!result) {
      throw new NotFoundError('Resource not found');
    }
    
    return result;
  }`;
    } else if (method === 'delete') {
      // Delete endpoint
      code += `
  async ${handler}(@Param('${paramName}') ${paramName}: string): Promise<{ success: boolean }> {
    const result = await this.${entityNameCamelCase}Service.delete(${paramName});
    
    if (!result) {
      throw new NotFoundError('Resource not found');
    }
    
    return { success: true };
  }`;
    }
  });
  
  // Close the class
  code += `
}
`;

  return code;
}