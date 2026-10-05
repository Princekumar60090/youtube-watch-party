# YouTube Watch Party

Real-time synchronized YouTube watch rooms with role-based access (Host / Moderator / Participant).

## Stack

- **Frontend:** React + TypeScript + Vite (deploy on **Vercel**)
- **Backend:** Spring Boot 3 / Java 21 (deploy on **Render**)
- **Realtime:** WebSockets (STOMP over native WS)
- **Database:** MongoDB Atlas

## Project structure

```text
youtube-watch-party/
├── backend/          Spring Boot API + WebSocket server
│   ├── Dockerfile    Production image for Render
│   ├── mvnw          Maven Wrapper (no local Maven required on CI)
│   └── .env.example
├── frontend/         React client
│   ├── vercel.json   SPA routing for Vercel
│   └── .env.example
├── render.yaml       Optional Render Blueprint
└── README.md
```

## Prerequisites

- Java 21+
- Maven 3.9+ (or use `./mvnw` / `mvnw.cmd` in `backend/`)
- Node.js 20+ / npm
- MongoDB Atlas cluster + URI

## Environment setup

Never commit real credentials. Copy the examples and fill in local values (gitignored).

### Backend (`backend/.env`)

```bash
cp backend/.env.example backend/.env
```

```env
SPRING_PROFILES_ACTIVE=dev
SERVER_PORT=8080
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
MONGODB_ENABLED=true
MONGODB_URI=your_mongodb_atlas_uri
MONGODB_DATABASE=watchparty
```

### Frontend (`frontend/.env`)

```bash
cp frontend/.env.example frontend/.env
```

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
./mvnw spring-boot:run
# Windows: mvnw.cmd spring-boot:run
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
2. Create a room with your name (you become Host)
3. Copy the room code and join from another browser/profile
4. Host/Moderator can load a YouTube link, play/pause, scrub, skip ±10s, and toggle captions
5. Participants can only watch — they cannot control playback
6. Host can manage roles, transfer host, or remove participants

## Deploy

### 0. MongoDB Atlas (required for production)

1. Create a cluster and database user
2. Network Access → allow `0.0.0.0/0` (Render egress IPs are dynamic)
3. Copy the connection string (`mongodb+srv://...`) — keep it secret

### 1. Push to GitHub

```bash
git add .
git status   # confirm .env files are NOT listed
git commit -m "Prepare production deploy for Render and Vercel"
git push origin main
```

Do **not** commit `backend/.env` or `frontend/.env`.

### 2. Backend on Render

**Option A — Blueprint (recommended)**

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**
2. Connect the GitHub repo
3. Confirm `render.yaml` (Docker service, health check `/actuator/health`)
4. Set secret env vars when prompted:

| Variable | Value |
|----------|--------|
| `MONGODB_URI` | Your Atlas connection string |
| `CORS_ALLOWED_ORIGINS` | Your Vercel URL(s), comma-separated |

Example CORS (after you know the Vercel URL):

```text
https://your-app.vercel.app,https://*.vercel.app
```

`https://*.vercel.app` covers preview deployments. Patterns are supported.

**Option B — Manual Web Service**

1. **New** → **Web Service** → connect repo
2. Settings:
   - **Root Directory:** `backend` (or leave blank and set paths below)
   - **Runtime:** Docker
   - **Dockerfile Path:** `./backend/Dockerfile` (if root is repo) or `./Dockerfile` (if root is `backend`)
   - **Docker Context:** same folder as the Dockerfile
   - **Health Check Path:** `/actuator/health`
3. Environment:

| Key | Value |
|-----|--------|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `MONGODB_ENABLED` | `true` |
| `MONGODB_DATABASE` | `watchparty` |
| `MONGODB_URI` | *(secret)* Atlas URI |
| `CORS_ALLOWED_ORIGINS` | `https://YOUR_VERCEL_APP.vercel.app,https://*.vercel.app` |

Render sets `PORT` automatically; the app binds to `${PORT}`.

After deploy, note the public URL, e.g. `https://youtube-watch-party-api.onrender.com`.

Smoke-check:

```text
GET https://YOUR_RENDER_URL/actuator/health
GET https://YOUR_RENDER_URL/api/v1/health
```

### 3. Frontend on Vercel

1. [Vercel](https://vercel.com) → **Add New Project** → import the GitHub repo
2. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `dist` (default)
3. **Environment Variables** (Production + Preview):

| Name | Value |
|------|--------|
| `VITE_API_BASE_URL` | `https://YOUR_RENDER_URL/api/v1` |
| `VITE_WS_URL` | `https://YOUR_RENDER_URL/ws` |

Use `https` for both. The client upgrades WebSocket to `wss://` automatically.

4. Deploy. Open the Vercel URL and create a room.

### 4. Final CORS sync

If you deployed backend before knowing the exact Vercel domain:

1. Update Render `CORS_ALLOWED_ORIGINS` to include the real Vercel URL
2. Redeploy / restart the Render service

### Deploy checklist

- [ ] Atlas Network Access allows `0.0.0.0/0`
- [ ] Render `SPRING_PROFILES_ACTIVE=prod` and `MONGODB_URI` set
- [ ] Render health endpoints return OK
- [ ] Vercel Root Directory = `frontend`
- [ ] Vercel `VITE_API_BASE_URL` and `VITE_WS_URL` point at Render (`https`, no trailing slash issues)
- [ ] Render `CORS_ALLOWED_ORIGINS` includes the Vercel origin (and optional `https://*.vercel.app`)
- [ ] Browser: create room, join second tab, play video, confirm sync

### Notes

- **Free Render** services sleep after inactivity; the first request (and WebSocket) may take ~30–60s to wake up.
- Vite embeds `VITE_*` at **build time** — change them on Vercel and **redeploy** the frontend.
- WebSockets must stay on the same Render **Web Service** (not a static site).

## Profiles

| Profile | Purpose |
|---------|---------|
| `dev`  | Local development; Mongo optional via `MONGODB_ENABLED` |
| `prod` | Production; requires `MONGODB_URI` and `CORS_ALLOWED_ORIGINS` |

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

Endpoint: `ws://localhost:8080/ws` (production: `wss://YOUR_RENDER_URL/ws`)

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
