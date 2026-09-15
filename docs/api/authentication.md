# HTTP Authentication API

Base URL is the configured `VITE_API_URL` on the frontend; the frontend defaults to `http://localhost:5000`.

## POST `/api/auth/register`

Creates a user account.

Authentication: none.

Request JSON:

```json
{
  "username": "player",
  "email": "player@example.com",
  "password": "<password>"
}
```

Validation:

- all fields required
- password length >= 8
- email must not already exist

Success: `201`

```json
{
  "message": "Account created successfully.",
  "user": {
    "id": "...",
    "username": "...",
    "email": "...",
    "created_at": "..."
  },
  "token": "<JWT>"
}
```

Errors: `400`, `409`, `500`.

## POST `/api/auth/login`

Authentication: none.

Request JSON:

```json
{
  "email": "player@example.com",
  "password": "<password>"
}
```

Success returns HTTP 200 with a message, user identity and JWT.

Errors: `400`, `401`, `500`.

## GET `/api/auth/me`

Authentication: `Authorization: Bearer <JWT>`.

Returns the current user:

```json
{
  "user": {
    "id": "...",
    "username": "...",
    "email": "...",
    "created_at": "..."
  }
}
```

Errors: `401`, `404`, `500`.

## GET `/api/health`

Authentication: none.

Returns:

```json
{
  "status": "ok",
  "message": "ShuffleUp backend is running."
}
```
