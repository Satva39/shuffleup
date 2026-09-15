# Troubleshooting

## Frontend does not start

Check:

```bash
cd frontend
npm install
npm run dev
```

Verify the frontend `.env` contains a correct `VITE_API_URL` when the backend is not at its default URL.

## Backend does not start

Check:

```bash
cd backend
npm install
npm start
```

Verify `PORT`, `DATABASE_URL`, `JWT_SECRET` and `FRONTEND_URL`.

## Database connection failure

Confirm the PostgreSQL server is reachable and `DATABASE_URL` is valid. The backend pool is created from that variable.

Apply `database/schema.sql` if the `users` table does not exist.

## Login/registration failure

Check browser network responses from:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

A stale/invalid JWT is removed by `AuthContext` after `/api/auth/me` fails.

## Socket connection failure

Confirm:

- backend is running
- `VITE_API_URL` points to the backend
- `FRONTEND_URL` matches the frontend origin
- any reverse proxy forwards WebSocket upgrades

## Room joining failure

Check the displayed server message. Common causes are:

- invalid room code
- full room
- game already started
- user not recognized by the socket payload

## Game does not start

Check the room's configured player minimum and readiness state. Only the host can start.

## Reconnection failure

Reconnection is implemented per game. Inspect the matching `<game>Socket.js` and `<game>Engine.js` module when diagnosing a particular game's state recovery.

## Production WebSocket issue

Check proxy WebSocket upgrade forwarding and origin/CORS configuration before changing application game code.
