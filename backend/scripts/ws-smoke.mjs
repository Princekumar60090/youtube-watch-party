import http from 'node:http';

const API = 'http://localhost:8080';
const WS_URL = 'ws://localhost:8080/ws';

function httpJson(method, path, body) {
  const payload = body ? JSON.stringify(body) : null;
  return new Promise((resolve, reject) => {
    const req = http.request(
      `${API}${path}`,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data || '{}') });
          } catch (error) {
            reject(error);
          }
        });
      },
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function stompFrame(command, headers = {}, body = '') {
  let frame = `${command}\n`;
  for (const [key, value] of Object.entries(headers)) {
    frame += `${key}:${value}\n`;
  }
  frame += `\n${body}\0`;
  return frame;
}

function parseFrames(buffer) {
  return buffer
    .split('\0')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((raw) => {
      const [headerPart, ...bodyParts] = raw.split('\n\n');
      const lines = headerPart.split('\n');
      const command = lines[0];
      const headers = {};
      for (const line of lines.slice(1)) {
        const idx = line.indexOf(':');
        if (idx > 0) headers[line.slice(0, idx)] = line.slice(idx + 1);
      }
      return { command, headers, body: bodyParts.join('\n\n') };
    });
}

function openStompClient(label) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    const events = [];
    let settled = false;

    ws.addEventListener('open', () => {
      ws.send(stompFrame('CONNECT', { 'accept-version': '1.2', host: 'localhost' }));
    });

    ws.addEventListener('message', (message) => {
      const frames = parseFrames(String(message.data));
      for (const frame of frames) {
        if (frame.command === 'CONNECTED' && !settled) {
          settled = true;
          resolve({
            ws,
            events,
            send(destination, payload) {
              ws.send(
                stompFrame(
                  'SEND',
                  {
                    destination,
                    'content-type': 'application/json',
                  },
                  JSON.stringify(payload),
                ),
              );
            },
            subscribe(destination, id) {
              ws.send(stompFrame('SUBSCRIBE', { id, destination }));
            },
          });
        }
        if (frame.command === 'MESSAGE') {
          try {
            events.push(JSON.parse(frame.body));
          } catch {
            events.push({ raw: frame.body });
          }
        }
        if (frame.command === 'ERROR') {
          events.push({ type: 'STOMP_ERROR', body: frame.body, headers: frame.headers });
        }
      }
    });

    ws.addEventListener('error', (error) => {
      if (!settled) reject(error);
    });

    setTimeout(() => {
      if (!settled) reject(new Error(`${label} STOMP connect timeout`));
    }, 8000);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hasEvent(events, type) {
  return events.some((event) => event.type === type);
}

const create = await httpJson('POST', '/api/v1/rooms', { username: 'HostUser' });
if (!create.body.success) throw new Error(`create failed: ${JSON.stringify(create.body)}`);
const roomId = create.body.data.room.roomId;
const hostUserId = create.body.data.userId;

const join = await httpJson('POST', `/api/v1/rooms/${roomId}/join`, { username: 'GuestUser' });
if (!join.body.success) throw new Error(`join failed: ${JSON.stringify(join.body)}`);
const guestUserId = join.body.data.userId;

const host = await openStompClient('host');
const guest = await openStompClient('guest');

host.subscribe(`/topic/rooms/${roomId}`, 'sub-host');
host.subscribe('/user/queue/room', 'sub-host-personal');
host.subscribe('/user/queue/errors', 'sub-host-errors');
guest.subscribe(`/topic/rooms/${roomId}`, 'sub-guest');
guest.subscribe('/user/queue/room', 'sub-guest-personal');
guest.subscribe('/user/queue/errors', 'sub-guest-errors');

await sleep(300);
host.send('/app/room.join', { roomId, userId: hostUserId });
await sleep(600);
guest.send('/app/room.join', { roomId, userId: guestUserId });
await sleep(800);

host.send('/app/room.changeVideo', { roomId, videoId: 'dQw4w9WgXcQ' });
await sleep(800);
host.send('/app/room.play', { roomId, currentTime: 12.5 });
await sleep(800);
guest.send('/app/room.pause', { roomId, currentTime: 15 });
await sleep(800);
host.send('/app/room.assignRole', { roomId, userId: guestUserId, role: 'MODERATOR' });
await sleep(800);
guest.send('/app/room.pause', { roomId, currentTime: 20 });
await sleep(800);

const errors = [...host.events, ...guest.events]
  .filter((event) => event.type === 'ERROR' || event.type === 'STOMP_ERROR')
  .map((event) => event.message || event.body || event);

const okJoin = hasEvent(host.events, 'USER_JOINED') || hasEvent(guest.events, 'USER_JOINED');
const okSync = hasEvent(host.events, 'SYNC_STATE') || hasEvent(guest.events, 'SYNC_STATE');
const okChange = hasEvent(guest.events, 'CHANGE_VIDEO') || hasEvent(host.events, 'CHANGE_VIDEO');
const okPlay = hasEvent(guest.events, 'PLAY') || hasEvent(host.events, 'PLAY');
const guestForbidden = guest.events.some(
  (event) => event.type === 'ERROR' && String(event.message || '').toLowerCase().includes('host or moderator'),
);
const okRole = hasEvent(host.events, 'ROLE_ASSIGNED') || hasEvent(guest.events, 'ROLE_ASSIGNED');
const okModPause = guest.events.some((event) => event.type === 'PAUSE') || host.events.some((event) => event.type === 'PAUSE');

console.log(
  JSON.stringify(
    {
      roomId,
      okJoin,
      okSync,
      okChange,
      okPlay,
      guestForbiddenBeforePromote: guestForbidden,
      okRole,
      okModPause,
      errors,
      hostEventTypes: [...new Set(host.events.map((e) => e.type))],
      guestEventTypes: [...new Set(guest.events.map((e) => e.type))],
    },
    null,
    2,
  ),
);

host.ws.close();
guest.ws.close();

if (!(okJoin && okSync && okChange && okPlay && guestForbidden && okRole && okModPause)) {
  process.exit(1);
}
