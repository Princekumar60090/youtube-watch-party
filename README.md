# YouTube Watch Party

Real-time synchronized YouTube watch rooms with role-based access.

## Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Spring Boot 3 (Java 21)
- **Realtime:** WebSockets (STOMP)
- **Database:** MongoDB Atlas

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
- MongoDB Atlas URI

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
- WebSocket endpoint: `http://localhost:8080/ws`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

### Using the app
1. Start backend and frontend
2. Create a room with a display name (you become Host)
3. Copy the room code and join from another browser/profile as a guest
4. Host/Moderator can load a YouTube URL, play/pause/seek
5. Host can promote guests to Moderator, remove participants, or transfer host

## Profiles

| Profile | Purpose |
|---------|---------|
| `dev`  | Default development; MongoDB disabled until enabled |
| `prod` | Production; expects env-based secrets and MongoDB URI |

## Room API

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

## WebSocket realtime API

Endpoint: `ws://localhost:8080/ws` (SockJS also supported)

Flow:
1. Create/join room with REST to get `roomId` + `userId`
2. Connect STOMP client to `/ws`
3. Subscribe to `/topic/rooms/{roomId}`, `/user/queue/room`, `/user/queue/errors`
4. Send join: destination `/app/room.join` with `{ "roomId", "userId" }`

| Client destination | Payload | Who can send |
|--------------------|---------|--------------|
| `/app/room.join` | `{ roomId, userId }` | Room participant |
| `/app/room.leave` | `{ roomId }` | Joined session |
| `/app/room.play` | `{ roomId, currentTime? }` | Host / Moderator |
| `/app/room.pause` | `{ roomId, currentTime? }` | Host / Moderator |
| `/app/room.seek` | `{ roomId, time }` | Host / Moderator |
| `/app/room.changeVideo` | `{ roomId, videoId }` | Host / Moderator |
| `/app/room.assignRole` | `{ roomId, userId, role }` | Host |
| `/app/room.removeParticipant` | `{ roomId, userId }` | Host |
| `/app/room.transferHost` | `{ roomId, userId }` | Host |

Server events on `/topic/rooms/{roomId}`: `SYNC_STATE`, `PLAY`, `PAUSE`, `SEEK`, `CHANGE_VIDEO`, `USER_JOINED`, `USER_LEFT`, `ROLE_ASSIGNED`, `PARTICIPANT_REMOVED`, `HOST_TRANSFERRED`, `ERROR`.

Server keeps authoritative `videoId`, `playState`, and `currentTime` in MongoDB and rejects unauthorized control events.
