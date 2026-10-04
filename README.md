# YouTube Watch Party

Real-time synchronized YouTube watch rooms with role-based access.

## Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Spring Boot 3 (Java 21)
- **Realtime:** WebSockets (STOMP)
- **Database:** MongoDB Atlas (wired in Part 2)

## Project structure

```text
youtube-watch-party/
├── backend/     Spring Boot API + WebSocket server
├── frontend/    React client
└── README.md
```

## Prerequisites

- Java 21+
- Maven 3.9+
- Node.js 20+ / npm
- MongoDB Atlas URI (needed from Part 2 onward)

## Environment setup

Never commit real credentials. Keep them only in local `.env` files (gitignored).

### Backend (`backend/.env`)

```env
SPRING_PROFILES_ACTIVE=dev
SERVER_PORT=8080
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
MONGODB_ENABLED=true
MONGODB_URI=your_mongodb_atlas_uri
MONGODB_DATABASE=watchparty
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_WS_URL=http://localhost:8080/ws
VITE_API_PROXY_TARGET=http://localhost:8080
VITE_DEV_PORT=5173
```

## Run locally

### Backend

```bash
cd backend
mvn spring-boot:run
```

- API health: `http://localhost:8080/api/v1/health`
- Actuator health: `http://localhost:8080/actuator/health`
- WebSocket endpoint (Part 3): `http://localhost:8080/ws`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

## Profiles

| Profile | Purpose |
|---------|---------|
| `dev`  | Default development; MongoDB disabled until enabled |
| `prod` | Production; expects env-based secrets and MongoDB URI |

## Room API (Part 2)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/rooms` | Create room (caller becomes Host) |
| POST | `/api/v1/rooms/{roomId}/join` | Join by room id (Participant) |
| POST | `/api/v1/rooms/join` | Join by room code (Participant) |
| GET | `/api/v1/rooms/{roomId}` | Get room + participants/roles |
| GET | `/api/v1/rooms/code/{roomCode}` | Get room by code |

Example create body:

```json
{ "username": "HostUser" }
```

Example join-by-code body:

```json
{ "roomCode": "ABC123", "username": "GuestUser" }
```

## Current progress

- [x] Part 1 — Foundation & skeleton
- [x] Part 2 — Room APIs + MongoDB
- [ ] Part 3 — WebSocket sync + RBAC
- [ ] Part 4 — Frontend watch party UX
- [ ] Part 5 — Production deploy + docs

## Live URL

Will be added after deployment (Part 5).
