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
  version?: string; // New field to specify API version
}

/**
 * Generates an interface for the entity
 */
export function generateInterfaceCode(config: ResourceConfig): string {
  const { entityName, properties } = config;
  
  // Convert entity name to proper camelCase for variables
  const entityNameCamelCase = entityName.charAt(0).toLowerCase() + entityName.slice(1);
  
  // Check if we have a status field with a union type
  const statusProperty = properties.find(p => p.name === 'status' && p.type.includes('|'));
  
  // Generate status type if needed
  const statusTypeExport = statusProperty ? 
    `export type ${entityName}Status = ${statusProperty.type};\n\n` : '';
  
  let code = `// src/models/interfaces/${entityNameCamelCase.toLowerCase()}.interface.ts
${statusTypeExport}export interface ${entityName} {
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
  
  // Define a type for the status if it exists
  const statusType = hasStatusField && statusProperty.type.includes('|') ? statusProperty.type : 'string';
  
  let code = `// src/services/${entityNameCamelCase}Service.ts
import { ${entityName}${hasStatusField && statusProperty.type.includes('|') ? `, ${entityName}Status` : ''} } from '../models/interfaces/${entityNameCamelCase.toLowerCase()}.interface';
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
  async updateStatus(id: string, status: ${statusType}): Promise<${entityName} | undefined> {
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
  
  // Define a type for the status if it exists
  const statusType = hasStatusField && statusProperty.type.includes('|') ? statusProperty.type : 'string';
  
  // Generate code for exporting status type if needed
  const statusTypeExport = hasStatusField && statusProperty.type.includes('|') ? 
    `export type ${entityName}Status = ${statusProperty.type};\n\n` : '';
  
  let code = `// src/repositories/${entityNameCamelCase.toLowerCase()}Repository.ts
import { ${entityName}${hasStatusField && statusProperty.type.includes('|') ? `, ${entityName}Status` : ''} } from '../models/interfaces/${entityNameCamelCase.toLowerCase()}.interface';

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
  async updateStatus(id: string, status: ${statusType}): Promise<${entityName} | undefined> {
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
import { IsString, IsEmail, IsOptional, IsNumber, IsBoolean, MinLength, IsIn, IsArray } from 'class-validator';
import { ApiProperty } from '../decorators/api-property.decorator';

export class Create${entityName}Dto {`;

  // Add properties with validation decorators
  properties.forEach(prop => {
    if (prop.description) {
      code += `
  /**
   * ${prop.description}
   */`;
    }
    
    // Handle array types specially
    const isArray = prop.type.endsWith('[]');
    const baseType = isArray ? prop.type.slice(0, -2) : prop.type;
    
    // Add API Property decorator
    code += `
  @ApiProperty({
    description: ${JSON.stringify(prop.description || prop.name)},
    required: ${prop.required !== false},${prop.type.includes('|') ? `
    enum: [${prop.type.split('|').map(t => t.trim().replace(/['"]/g, '')).map(o => `'${o}'`).join(', ')}],` : ''}
    type: '${isArray ? 'array' : baseType === 'number' ? 'number' : baseType === 'boolean' ? 'boolean' : 'string'}'${isArray ? `,
    items: {
      type: '${baseType === 'number' ? 'number' : baseType === 'boolean' ? 'boolean' : 'string'}'
    }` : ''}
  })`;
    
    // Add validation decorators based on type
    if (isArray) {
      code += `
  @IsArray()`;
    } else if (baseType === 'string') {
      code += `
  @IsString()`;
      if (prop.required !== false) {
        code += `
  @MinLength(1)`;
      }
    } else if (baseType === 'number') {
      code += `
  @IsNumber()`;
    } else if (baseType === 'boolean') {
      code += `
  @IsBoolean()`;
    } else if (baseType.includes('|')) {
      // For union types like 'PENDING' | 'APPROVED'
      const options = baseType.split('|').map(t => t.trim().replace(/['"]/g, ''));
      code += `
  @IsString()
  @IsIn([${options.map(o => `'${o}'`).join(', ')}])`;
    }
    
    if (prop.required === false) {
      code += `
  @IsOptional()`;
    }
    
    const optional = prop.required === false ? '?' : '';
    code += `
  ${prop.name}${optional}: ${prop.type};
`;
  });

  code += `
}

export class Update${entityName}Dto {`;

  // Add properties for update DTO (all optional)
  properties.forEach(prop => {
    if (prop.description) {
      code += `
  /**
   * ${prop.description}
   */`;
    }
    
    // Handle array types specially
    const isArray = prop.type.endsWith('[]');
    const baseType = isArray ? prop.type.slice(0, -2) : prop.type;
    
    // Add API Property decorator
    code += `
  @ApiProperty({
    description: ${JSON.stringify(prop.description || prop.name)},
    required: false,${prop.type.includes('|') ? `
    enum: [${prop.type.split('|').map(t => t.trim().replace(/['"]/g, '')).map(o => `'${o}'`).join(', ')}],` : ''}
    type: '${isArray ? 'array' : baseType === 'number' ? 'number' : baseType === 'boolean' ? 'boolean' : 'string'}'${isArray ? `,
    items: {
      type: '${baseType === 'number' ? 'number' : baseType === 'boolean' ? 'boolean' : 'string'}'
    }` : ''}
  })`;
    
    // All properties are optional in the UpdateDTO
    code += `
  @IsOptional()`;
    
    // Add type validation
    if (isArray) {
      code += `
  @IsArray()`;
    } else if (baseType === 'string') {
      code += `
  @IsString()`;
    } else if (baseType === 'number') {
      code += `
  @IsNumber()`;
    } else if (baseType === 'boolean') {
      code += `
  @IsBoolean()`;
    } else if (baseType.includes('|')) {
      const options = baseType.split('|').map(t => t.trim().replace(/['"]/g, ''));
      code += `
  @IsString()
  @IsIn([${options.map(o => `'${o}'`).join(', ')}])`;
    }
    
    code += `
  ${prop.name}?: ${prop.type};
`;
  });

  code += `
}
`;

  return code;
}

/**
 * Construct the version-specific path for a resource
 */
function getVersionedPath(basePath: string, version?: string): string {
  if (!version) return basePath;
  return `/v${version}${basePath}`;
}

/**
 * Generates all files for a resource
 */
export function generateResource(config: ResourceConfig): void {
  const baseDir = process.cwd();
  const { version } = config;
  
  // Setup versioned paths for routes
  const versionedBasePath = getVersionedPath(config.basePath, version);
  const versionedConfig = { ...config, basePath: versionedBasePath };
  
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
  
  // Determine file naming based on version
  const getVersionedFileName = (baseName: string) => {
    if (!version) return baseName;
    return `${baseName}.v${version}`;
  };
  
  // Convert entity name to lowercase for file naming
  const entityLowerCase = config.entityName.toLowerCase();
  
  // Generate files
  const files = [
    {
      path: path.join(baseDir, `src/models/interfaces/${entityLowerCase}.interface.ts`),
      content: generateInterfaceCode(config)
    },
    {
      path: path.join(baseDir, `src/services/${getVersionedFileName(entityLowerCase)}Service.ts`),
      content: generateServiceCode(config)
    },
    {
      path: path.join(baseDir, `src/controllers/${getVersionedFileName(entityLowerCase)}Controller.ts`),
      content: generateControllerCode({...versionedConfig, properties: config.properties})
    }
  ];
  
  if (config.generateRepository) {
    files.push({
      path: path.join(baseDir, `src/repositories/${getVersionedFileName(entityLowerCase)}Repository.ts`),
      content: generateRepositoryCode(config)
    });
  }
  
  if (config.generateDtos) {
    files.push({
      path: path.join(baseDir, `src/dtos/${getVersionedFileName(entityLowerCase)}Dto.ts`),
      content: generateDtoCode(config)
    });
  }
  
  // Write files
  files.forEach(file => {
    fs.writeFileSync(file.path, file.content);
    console.log(`Generated: ${file.path}`);
  });
  
  // Log version information
  if (version) {
    console.log(`API Version: v${version} - Endpoints will be available at: ${versionedBasePath}`);
  }
}