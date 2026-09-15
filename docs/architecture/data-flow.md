# Data Flow

## Authentication

```text
Register/Login form
      |
      v
frontend auth service
      |
      v
POST /api/auth/*
      |
      v
Express controller
      |
      v
PostgreSQL users table
      |
      v
JWT + user
      |
      v
AuthContext / localStorage
```

## Room flow

```text
Lobby
  |
  +--> socket create-room --> roomManager
  |                            |
  |                            +--> room record
  |                            +--> callback
  |                            +--> room-updated
  |
  +--> socket join-room ------> roomManager
                               |
                               +--> callback
                               +--> room-updated
```

## Game flow

```text
Game page / game hook
       |
       | Socket.IO action
       v
Game Socket Handler
       |
       | validation / identity / room
       v
Game Engine
       |
       | state mutation + result
       v
Game Socket Handler
       |
       +--> public-state / state / result events
       v
Game clients
```

## Persistence boundary

User account data crosses into PostgreSQL. Room state and game state stay in server memory in the inspected implementation. Restarting the backend therefore does not provide durable room/game recovery.
