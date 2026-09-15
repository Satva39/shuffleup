# Environment Variables

Only variable names are documented here.

## Backend

| Variable | Purpose |
|---|---|
| `PORT` | HTTP server port; defaults to 5000 when absent |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing/verification secret |
| `FRONTEND_URL` | Allowed frontend origin for HTTP CORS and Socket.IO CORS |

## Frontend

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | HTTP and Socket.IO server base URL |

Do not commit actual credentials or secret values.

The repository includes `.env.example` files containing placeholder values.
