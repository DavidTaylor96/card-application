# API Resource Generator

This automation script is a powerful code generator that creates a complete API resource structure from a simple JSON configuration file.

## Main Features

1. **One-Command API Creation**: Generate an entire API resource (controller, service, repository, DTOs, interfaces) with a single command.

2. **Standardized Code Structure**: Creates a consistent structure following best practices for TypeScript microservices.

3. **Type-Safe Implementation**: All generated code has proper TypeScript typing to catch errors during development.

4. **Decorator-Based Architecture**: Uses routing-controllers decorators for clear, declarative API definitions.

5. **Validation Built-In**: Includes DTO validation using class-validator decorators.

6. **Automatic API Documentation**: Generates interactive Swagger/OpenAPI documentation from your code.

## How It Works

1. Create a JSON configuration file (like `card-application-resource.json`) that defines:
   - Basic resource information (name, routes)
   - Data model properties with types and validation requirements
   - API endpoints with methods, paths, and handlers

2. Run the script:
   ```bash
   npx ts-node scripts/generate-resource.ts card-application-resource.json --server --swagger
   ```

3. It automatically generates:
   - Controller with decorated endpoints
   - Service layer with business logic
   - Repository for data access
   - Data models/interfaces
   - DTOs with validation
   - Server configuration with automatic controller discovery
   - Swagger documentation setup

## API Design Principles

The generated API follows RESTful design patterns:

- **Resource-Based URLs**: Endpoints are organized around resources (e.g., `/card-applications`)
- **HTTP Method Semantics**: 
  - `GET` for retrieving resources
  - `POST` for creating resources
  - `PATCH` for updating resources
  - `DELETE` for removing resources
- **HTTP Status Codes**: Appropriate status codes for different operations
- **JSON Request/Response**: All data exchange occurs in JSON format
- **Input Validation**: Request data is validated through DTOs
- **Documentation**: API is documented with OpenAPI/Swagger
- **Clear Error Handling**: Consistent error response format

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
3. **Maintainability**: Changes to patterns can be made in one place
4. **Reduced Errors**: Standardized approach prevents common mistakes
5. **Self-Documenting**: Generates interactive API documentation

## Generated Structure

```
src/
├── controllers/          # Route handlers with decorators
│   └── creditCardApplicationController.ts
├── services/             # Business logic implementation
│   └── creditCardApplicationService.ts
├── repositories/         # Data access layer
│   └── creditCardApplicationRepository.ts
├── models/               # Data models and interfaces
│   └── interfaces/
│       └── creditCardApplication.interface.ts
├── dtos/                 # Data Transfer Objects with validation
│   └── creditCardApplicationDto.ts
├── server.ts             # Express server with controller loading
└── swagger.ts            # OpenAPI documentation setup
```

## API Documentation

After running the generator with the `--swagger` flag and starting your server, view your interactive API documentation at:

```
http://localhost:3000/api-docs
```

The documentation includes:
- All available endpoints
- Request/response schemas
- Input parameters and validation rules
- Try-it-out functionality to test the API directly

## Usage

To add a new API resource to your project:

1. Create a JSON configuration file for your resource
2. Run the generator script with appropriate flags
   ```bash
   npm run swaggergen  # If you've added this as a script
   ```
3. Start your development server
   ```bash
   npm run dev:docker
   ```
4. Implement any custom business logic in the service layer

The script takes a "blueprint" approach to API development, letting you focus on business logic rather than repetitive code structure.