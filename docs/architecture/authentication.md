# Authentication

## Registration

`POST /api/auth/register` requires `username`, `email` and `password`.

Validation implemented by the controller:

- all three values are required
- password must be at least 8 characters
- email is lower-cased for lookup/storage
- duplicate email returns HTTP 409

Passwords are hashed with `bcryptjs` using cost factor 12 before insertion into `users`.

On success the endpoint returns the created user's non-secret identity fields and a JWT.

## Login

`POST /api/auth/login` requires email and password. The backend looks up the user by lower-cased email and compares the submitted password with the stored bcrypt hash.

Invalid credentials return HTTP 401.

## JWT

The token payload contains:

- `id`
- `username`

The signing secret is read from `JWT_SECRET`.

Token expiration is `7d`.

## Current-user endpoint

`GET /api/auth/me` requires a Bearer token. The middleware verifies the token and exposes its decoded identity as `req.user`; the controller then reloads `id`, `username`, `email` and `created_at` from PostgreSQL.

## Frontend persistence

The frontend stores the token and serialized user in browser `localStorage`. On application load it validates the token by calling `/api/auth/me`.

## Logout

Logout is client-side: `AuthContext.logout()` removes both localStorage entries and clears the React user state. No server-side token revocation endpoint exists in the inspected project.

## Security boundary

This documentation intentionally omits password hashes, secrets, connection strings and user-specific private data.
