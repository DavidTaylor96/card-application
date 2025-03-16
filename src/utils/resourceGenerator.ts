// src/utils/resourceGenerator.ts
import fs from 'fs';
import path from 'path';
import { ControllerConfig, generateControllerCode } from './controllerGenerator';

export interface EntityProperty {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
}

export interface ResourceConfig extends ControllerConfig {
  entityName: string;
  properties: EntityProperty[];
  generateRepository: boolean;
  generateDtos: boolean;
}

/**
 * Generates an interface for the entity
 */
export function generateInterfaceCode(config: ResourceConfig): string {
  const { entityName, properties } = config;
  
  // Convert entity name to proper camelCase for variables
  const entityNameCamelCase = entityName.charAt(0).toLowerCase() + entityName.slice(1);
  
  let code = `// src/models/interfaces/${entityNameCamelCase.toLowerCase()}.interface.ts
export interface ${entityName} {
`;

  // Add properties
  properties.forEach(prop => {
    if (prop.description) {
      code += `  /**
   * ${prop.description}
   */
`;
    }
    const optional = prop.required === false ? '?' : '';
    code += `  ${prop.name}${optional}: ${prop.type};\n`;
  });

  // Add standard properties
  code += `
  // Standard properties
  id: string;
  createdAt: string;
  updatedAt: string;
}
`;

  return code;
}

/**
 * Generates a service class for the entity
 */
export function generateServiceCode(config: ResourceConfig): string {
  const { entityName, serviceName } = config;
  const statusProperty = config.properties.find(p => p.name === 'status');
  const hasStatusField = !!statusProperty;
  
  // Convert entity name to proper camelCase for variables
  const entityNameCamelCase = entityName.charAt(0).toLowerCase() + entityName.slice(1);
  
  // Convert to readable format with spaces for comments
  const readableEntityName = entityName.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
  
  let code = `// src/services/${entityNameCamelCase}Service.ts
import { ${entityName} } from '../models/interfaces/${entityNameCamelCase.toLowerCase()}.interface';
${config.generateRepository ? `import { ${entityName}Repository } from '../repositories/${entityNameCamelCase.toLowerCase()}Repository';` : ''}

${hasStatusField && statusProperty.type.includes('|') ? 
  `// Valid status values: ${statusProperty.type}` : ''}

${config.generateRepository ? '' : `// In-memory storage (will replace with database later)
let ${entityNameCamelCase}s: ${entityName}[] = [];
let nextId = 1;`}

export class ${serviceName} {
  ${config.generateRepository ? `private ${entityNameCamelCase}Repository: ${entityName}Repository;
  
  constructor() {
    this.${entityNameCamelCase}Repository = new ${entityName}Repository();
  }` : ''}

  // Get all ${readableEntityName}s
  async getAll(params?: any): Promise<${entityName}[]> {
    ${config.generateRepository ? 
      `return this.${entityNameCamelCase}Repository.findAll(params);` : 
      `return ${entityNameCamelCase}s;`}
  }
  
  // Get ${readableEntityName} by ID
  async getById(id: string): Promise<${entityName} | undefined> {
    ${config.generateRepository ? 
      `return this.${entityNameCamelCase}Repository.findById(id);` : 
      `return ${entityNameCamelCase}s.find(item => item.id === id);`}
  }
  
  // Create new ${readableEntityName}
  async create(data: any): Promise<${entityName}> {
    ${config.generateRepository ? 
      `return this.${entityNameCamelCase}Repository.create(data);` : 
      `const new${entityName}: ${entityName} = {
      id: String(nextId++),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    ${entityNameCamelCase}s.push(new${entityName});
    return new${entityName};`}
  }
  
  // Update ${readableEntityName}
  async update(id: string, data: any): Promise<${entityName} | undefined> {
    ${config.generateRepository ? 
      `return this.${entityNameCamelCase}Repository.update(id, data);` : 
      `const index = ${entityNameCamelCase}s.findIndex(item => item.id === id);
    
    if (index === -1) {
      return undefined;
    }
    
    ${entityNameCamelCase}s[index] = {
      ...${entityNameCamelCase}s[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    return ${entityNameCamelCase}s[index];`}
  }
  ${hasStatusField ? `
  // Update ${readableEntityName} status
  async updateStatus(id: string, status: string): Promise<${entityName} | undefined> {
    ${config.generateRepository ? 
      `return this.${entityNameCamelCase}Repository.updateStatus(id, status);` : 
      `const index = ${entityNameCamelCase}s.findIndex(item => item.id === id);
    
    if (index === -1) {
      return undefined;
    }
    
    ${entityNameCamelCase}s[index] = {
      ...${entityNameCamelCase}s[index],
      status,
      updatedAt: new Date().toISOString()
    };
    
    return ${entityNameCamelCase}s[index];`}
  }` : ''}
  
  // Delete ${readableEntityName}
  async delete(id: string): Promise<boolean> {
    ${config.generateRepository ? 
      `return this.${entityNameCamelCase}Repository.delete(id);` : 
      `const index = ${entityNameCamelCase}s.findIndex(item => item.id === id);
    
    if (index === -1) {
      return false;
    }
    
    ${entityNameCamelCase}s.splice(index, 1);
    return true;`}
  }
}
`;

  return code;
}

/**
 * Generates a repository class for the entity
 */
export function generateRepositoryCode(config: ResourceConfig): string {
  const { entityName } = config;
  const statusProperty = config.properties.find(p => p.name === 'status');
  const hasStatusField = !!statusProperty;
  
  // Convert entity name to proper camelCase for variables
  const entityNameCamelCase = entityName.charAt(0).toLowerCase() + entityName.slice(1);
  
  // Convert to readable format with spaces for comments
  const readableEntityName = entityName.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
  
  let code = `// src/repositories/${entityNameCamelCase.toLowerCase()}Repository.ts
import { ${entityName} } from '../models/interfaces/${entityNameCamelCase.toLowerCase()}.interface';

// In-memory storage (will replace with database later)
let ${entityNameCamelCase}s: ${entityName}[] = [];
let nextId = 1;

export class ${entityName}Repository {
  // Find all ${readableEntityName}s
  async findAll(params?: any): Promise<${entityName}[]> {
    // TODO: Add filtering based on params
    return ${entityNameCamelCase}s;
  }
  
  // Find ${readableEntityName} by ID
  async findById(id: string): Promise<${entityName} | undefined> {
    return ${entityNameCamelCase}s.find(item => item.id === id);
  }
  
  // Create new ${readableEntityName}
  async create(data: any): Promise<${entityName}> {
    const new${entityName}: ${entityName} = {
      id: String(nextId++),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    ${entityNameCamelCase}s.push(new${entityName});
    return new${entityName};
  }
  
  // Update ${readableEntityName}
  async update(id: string, data: any): Promise<${entityName} | undefined> {
    const index = ${entityNameCamelCase}s.findIndex(item => item.id === id);
    
    if (index === -1) {
      return undefined;
    }
    
    ${entityNameCamelCase}s[index] = {
      ...${entityNameCamelCase}s[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    return ${entityNameCamelCase}s[index];
  }
  ${hasStatusField ? `
  // Update ${readableEntityName} status
  async updateStatus(id: string, status: string): Promise<${entityName} | undefined> {
    const index = ${entityNameCamelCase}s.findIndex(item => item.id === id);
    
    if (index === -1) {
      return undefined;
    }
    
    ${entityNameCamelCase}s[index] = {
      ...${entityNameCamelCase}s[index],
      status,
      updatedAt: new Date().toISOString()
    };
    
    return ${entityNameCamelCase}s[index];
  }` : ''}
  
  // Delete ${readableEntityName}
  async delete(id: string): Promise<boolean> {
    const index = ${entityNameCamelCase}s.findIndex(item => item.id === id);
    
    if (index === -1) {
      return false;
    }
    
    ${entityNameCamelCase}s.splice(index, 1);
    return true;
  }
}
`;

  return code;
}

/**
 * Generates DTO classes for the entity
 */
export function generateDtoCode(config: ResourceConfig): string {
  const { entityName, properties } = config;
  
  // Convert entity name to proper camelCase for variables
  const entityNameCamelCase = entityName.charAt(0).toLowerCase() + entityName.slice(1);
  
  let code = `// src/dtos/${entityNameCamelCase.toLowerCase()}Dto.ts
import { IsString, IsEmail, IsOptional, IsNumber, IsBoolean, MinLength, IsIn } from 'class-validator';

export class Create${entityName}Dto {
`;

  // Add properties with validation decorators
  properties.forEach(prop => {
    if (prop.description) {
      code += `  /**
   * ${prop.description}
   */
`;
    }
    
    // Add validation decorators based on type
    if (prop.type === 'string') {
      code += `  @IsString()\n`;
      if (prop.required !== false) {
        code += `  @MinLength(1)\n`;
      }
    } else if (prop.type === 'number') {
      code += `  @IsNumber()\n`;
    } else if (prop.type === 'boolean') {
      code += `  @IsBoolean()\n`;
    } else if (prop.type.includes('|')) {
      // For union types like 'PENDING' | 'APPROVED'
      const options = prop.type.split('|').map(t => t.trim().replace(/['"]/g, ''));
      code += `  @IsString()\n`;
      code += `  @IsIn([${options.map(o => `'${o}'`).join(', ')}])\n`;
    }
    
    if (prop.required === false) {
      code += `  @IsOptional()\n`;
    }
    
    const optional = prop.required === false ? '?' : '';
    code += `  ${prop.name}${optional}: ${prop.type};\n\n`;
  });

  code += `}

export class Update${entityName}Dto {
`;

  // Add properties for update DTO (all optional)
  properties.forEach(prop => {
    if (prop.description) {
      code += `  /**
   * ${prop.description}
   */
`;
    }
    
    // Add validation decorators based on type
    code += `  @IsOptional()\n`;
    if (prop.type === 'string') {
      code += `  @IsString()\n`;
    } else if (prop.type === 'number') {
      code += `  @IsNumber()\n`;
    } else if (prop.type === 'boolean') {
      code += `  @IsBoolean()\n`;
    } else if (prop.type.includes('|')) {
      // For union types like 'PENDING' | 'APPROVED'
      const options = prop.type.split('|').map(t => t.trim().replace(/['"]/g, ''));
      code += `  @IsString()\n`;
      code += `  @IsIn([${options.map(o => `'${o}'`).join(', ')}])\n`;
    }
    
    code += `  ${prop.name}?: ${prop.type};\n\n`;
  });

  code += `}
`;

  return code;
}

/**
 * Generates all files for a resource
 */
export function generateResource(config: ResourceConfig): void {
  const baseDir = process.cwd();
  
  // Create directories if they don't exist
  const dirs = [
    path.join(baseDir, 'src/controllers'),
    path.join(baseDir, 'src/services'),
    path.join(baseDir, 'src/models/interfaces'),
    config.generateRepository ? path.join(baseDir, 'src/repositories') : null,
    config.generateDtos ? path.join(baseDir, 'src/dtos') : null
  ].filter(Boolean);
  
  dirs.forEach((dir: any) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  // Generate files
  const files = [
    {
      path: path.join(baseDir, `src/models/interfaces/${config.entityName.toLowerCase()}.interface.ts`),
      content: generateInterfaceCode(config)
    },
    {
      path: path.join(baseDir, `src/services/${config.entityName.toLowerCase()}Service.ts`),
      content: generateServiceCode(config)
    },
    {
      path: path.join(baseDir, `src/controllers/${config.entityName.toLowerCase()}Controller.ts`),
      content: generateControllerCode(config)
    }
  ];
  
  if (config.generateRepository) {
    files.push({
      path: path.join(baseDir, `src/repositories/${config.entityName.toLowerCase()}Repository.ts`),
      content: generateRepositoryCode(config)
    });
  }
  
  if (config.generateDtos) {
    files.push({
      path: path.join(baseDir, `src/dtos/${config.entityName.toLowerCase()}Dto.ts`),
      content: generateDtoCode(config)
    });
  }
  
  // Write files
  files.forEach(file => {
    fs.writeFileSync(file.path, file.content);
    console.log(`Generated: ${file.path}`);
  });
}