# API Resource Generator

This automation script is a powerful code generator that creates a complete API resource structure from a simple JSON configuration file.

## Main Features

1. **One-Command API Creation**: Generate an entire API resource (controller, service, repository, DTOs, interfaces) with a single command.

2. **Standardized Code Structure**: Creates a consistent structure following best practices for TypeScript microservices.

3. **Type-Safe Implementation**: All generated code has proper TypeScript typing to catch errors during development.

4. **Decorator-Based Architecture**: Uses routing-controllers decorators for clear, declarative API definitions.

5. **Validation Built-In**: Includes DTO validation using class-validator decorators.

## How It Works

1. Create a JSON configuration file (like `card-application-resource.json`) that defines:
   - Basic resource information (name, routes)
   - Data model properties with types and validation requirements
   - API endpoints with methods, paths, and handlers

2. Run the script:
   ```bash
   npx ts-node scripts/generate-resource.ts card-application-resource.json --server
   ```

3. It automatically generates:
   - Controller with decorated endpoints
   - Service layer with business logic
   - Repository for data access
   - Data models/interfaces
   - DTOs with validation
   - Optionally, server configuration

## Example Configuration

```json
{
  "name": "CreditCardApplication",
  "basePath": "/card-applications",
  "serviceName": "CreditCardApplicationService",
  "serviceImportPath": "../services/creditCardApplicationService",
  "entityName": "CreditCardApplication",
  "generateRepository": true,
  "generateDtos": true,
  "properties": [
    {
      "name": "applicantName",
      "type": "string",
      "required": true,
      "description": "Full name of the applicant"
    },
    {
      "name": "email",
      "type": "string",
      "required": true,
      "description": "Email address of the applicant"
    }
  ],
  "endpoints": [
    {
      "method": "get",
      "path": "/",
      "handler": "getAllApplications",
      "enableLogging": true,
      "description": "Retrieve all applications"
    },
    {
      "method": "post",
      "path": "/",
      "handler": "createApplication",
      "statusCode": 201,
      "description": "Submit new application"
    }
  ]
}
```

## Key Benefits

1. **Consistency**: Every API resource follows the same patterns and practices

2. **Time Savings**: Eliminates boilerplate code writing

3. **Maintainability**: Changes to patterns can be made in one place (the generator) rather than across many files

4. **Reduced Errors**: Standardized approach prevents common mistakes

## Generated Structure

```
src/
├── controllers/
│   └── creditCardApplicationController.ts
├── services/
│   └── creditCardApplicationService.ts
├── repositories/
│   └── creditCardApplicationRepository.ts
├── models/
│   └── interfaces/
│       └── creditCardApplication.interface.ts
└── dtos/
    └── creditCardApplicationDto.ts
```

## Usage

To add a new API resource to your project:

1. Create a JSON configuration file for your resource
2. Run the generator script
3. Install any new dependencies
4. Implement any custom business logic in the service layer

The script implements a "blueprint" approach to API development, letting you focus on business logic rather than repetitive code structure.