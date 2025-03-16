// src/decorators/log.decorator.ts
export function Log() {
    return function (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      // Save a reference to the original method
      const originalMethod = descriptor.value;
  
      // Rewrite the method with logging
      descriptor.value = async function (...args: any[]) {
        console.log(`[${new Date().toISOString()}] Calling ${propertyKey}`);
        const startTime = Date.now();
        
        try {
          // Call the original method
          const result = await originalMethod.apply(this, args);
          
          // Log success and time
          const endTime = Date.now();
          console.log(`[${new Date().toISOString()}] ${propertyKey} completed in ${endTime - startTime}ms`);
          
          return result;
        } catch (error: any) {
          // Log error
          console.error(`[${new Date().toISOString()}] ${propertyKey} failed: ${error.message}`);
          throw error;
        }
      };
  
      return descriptor;
    };
  }