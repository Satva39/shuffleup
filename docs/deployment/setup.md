# Local Setup

## Prerequisites

The repository contains Node.js applications for the frontend and backend and uses PostgreSQL.

Git is required to obtain the source repository.

## Install dependencies

From the project root:

```bash
cd backend
npm install

cd ../frontend
npm install
```

The repository does not define a root install script; dependencies are installed separately in the two application directories.

## Configure backend

Copy or recreate `backend/.env` using the variable names shown in `backend/.env.example`.

Required names:

- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL`

## Configure frontend

Use `frontend/.env` with:

- `VITE_API_URL`

The provided example defaults to `http://localhost:5000`.

## Database

Create the PostgreSQL database and apply `database/schema.sql`.

The schema creates the `users` table and enables `pgcrypto` for UUID generation.

## Start backend

Development:

```bash
cd backend
npm run dev
```

Production-style local start:

```bash
cd backend
npm start
```

## Start frontend

```bash
cd frontend
npm run dev
```

Open the Vite development URL shown by the terminal.

## Test game engines

The backend exposes one npm test script for each of the 14 engines that include a dedicated test file. The exact script names are listed in `backend/package.json`; run, for example:

```bash
npm run test:war
```

No separate Kachuful engine test script is defined in the inspected package.json.
