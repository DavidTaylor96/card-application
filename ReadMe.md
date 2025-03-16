# Running Your API with Docker and Nodemon

This guide explains how to run your TypeScript API in a Docker container with automatic code reloading using nodemon.

## Prerequisites

- Docker and Docker Compose installed on your machine
- Node.js project with TypeScript

## Getting Started

1. Create the development Dockerfile and Docker Compose configuration as shown in the previous files.

2. Start the development environment:

```bash
# Start with existing images (if any)
npm run dev:docker

# Or rebuild images before starting
npm run dev:docker:build
```

3. Your API will be available at `http://localhost:3000` and will automatically reload whenever you make changes to your source files.

## How It Works

- The Docker container runs nodemon which watches your `src` directory for changes
- When you modify a file, nodemon automatically restarts the server with the new code
- Your local `src` directory is mounted as a volume in the container, so changes are immediately visible
- Node modules are also mounted to avoid rebuilding the image when dependencies change

## Debugging

The configuration includes debugging support:

- Debug port 9229 is exposed
- Connect your IDE debugger to `localhost:9229`
- For VS Code, you can add this configuration to your `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "attach",
  "name": "Docker: Attach to Node",
  "remoteRoot": "/usr/src/app",
  "localRoot": "${workspaceFolder}",
  "port": 9229,
  "address": "localhost",
  "skipFiles": ["<node_internals>/**"]
}
```

## Tips for Efficient Development

1. **Environment Variables**: Add any additional environment variables to your `docker-compose.dev.yml` file.

2. **Database Integration**: For local development with a database, add a database service to your Docker Compose file:

```yaml
services:
  # ... your api service ...
  
  db:
    image: postgres:14
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: cardapi
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```

3. **Performance**: For better performance on macOS or Windows, you can exclude node_modules from the volume mounts and install dependencies in the container.

4. **Production Deployment**: Keep a separate `Dockerfile` (without `.dev`) for production builds that:
   - Copies all source files
   - Builds the TypeScript code
   - Runs the compiled JavaScript directly