# Production Deployment

## Current project facts

The repository does not name a production hosting provider. Deployment must therefore be treated as provider-neutral.

## Frontend

The frontend has the standard Vite commands:

```bash
npm run build
npm run preview
```

A production host must serve the Vite build output over HTTPS in a browser-accessible domain.

## Backend

The backend is a Node HTTP server. Production start command:

```bash
npm start
```

The runtime must provide the required backend environment variables.

## CORS and WebSockets

Set `FRONTEND_URL` to the exact browser origin used by the deployed frontend. Socket.IO uses the same origin setting.

The production proxy/load balancer must forward WebSocket upgrades to the Node process.

## Database

Set `DATABASE_URL` to the production PostgreSQL connection string. Apply the repository schema before accepting registrations.

## Secrets

Provide `JWT_SECRET` through the deployment environment. Never store the secret in source control or documentation.

## HTTPS and domain

Use HTTPS for the browser-facing frontend and API. The Socket.IO connection should also use the secure transport implied by the deployed HTTPS endpoint.

## Logging and monitoring

The current server logs startup, PostgreSQL connection/error messages, player connection/disconnection messages and controller/database errors. No dedicated monitoring or metrics system is included in the inspected code.
