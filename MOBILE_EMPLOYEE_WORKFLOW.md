# ShuffleUp Mobile Employee Handoff Workflow

Use one employee per major workstream. Every employee receives the current `mobile/` folder plus the current backend/web project for inspection only.

## Universal rules for every employee
You are working on ShuffleUp Mobile, a production Android client for the existing ShuffleUp platform.

1. Use React Native + Expo + JavaScript + JSX only.
2. Do not use TypeScript, `.ts`, or `.tsx`.
3. Do not modify `frontend/` or `backend/` unless the lead explicitly authorizes a proven backward-compatible compatibility fix.
4. Do not create a second backend, database, game engine, or fake multiplayer system.
5. The existing backend is authoritative for game state, cards, turns, actions, scores, winners, and completion.
6. Reuse the exact existing game ID, Socket.IO event names, payload shapes, and reconnection behavior.
7. Inspect the current code before changing anything. Never invent an API/event/payload when the source code can answer it.
8. Mobile UI must be genuinely mobile-first: touch-sized controls, no horizontal overflow, readable cards, portrait-first layouts, and landscape handling where the game requires it.
9. Do not remove working functionality outside your assigned scope.
10. Test before handoff. Report exactly what was changed, what was tested, and any remaining issue.

## Required response format
PHASE X — NAME

Goal:
...

Inspect:
...

Changed/Added files:
...

Testing:
...

Expected result:
...

STOP HERE.

## Handoff
Return only the changed/added mobile files as a ZIP when requested. Never return the entire web project unless explicitly asked.
