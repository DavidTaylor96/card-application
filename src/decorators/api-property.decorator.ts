// src/decorators/api-property.decorator.ts
export interface ApiPropertyOptions {
    description?: string;
    required?: boolean;
    type?: string;
    enum?: any[];
    example?: any;
    default?: any;
    items?: any;
    [key: string]: any;
  }
  
  export function ApiProperty(options?: ApiPropertyOptions): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol) => {
      // This is just a metadata decorator for documentation
      // It doesn't need runtime functionality for OpenAPI to work
    };
  }