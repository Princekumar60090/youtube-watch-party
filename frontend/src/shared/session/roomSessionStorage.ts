import type { RoomRole, RoomSession, RoomSessionLocal } from '@/shared/types/room';

const STORAGE_KEY = 'watchparty.session';

export function saveRoomSession(session: RoomSession): RoomSessionLocal {
  const local: RoomSessionLocal = {
    roomId: session.room.roomId,
    roomCode: session.room.roomCode,
    userId: session.userId,
    username: session.username,
    role: session.role,
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(local));
  return local;
}

export function updateLocalRole(role: RoomRole): void {
  const current = loadRoomSession();
  if (!current) return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, role }));
}

export function loadRoomSession(): RoomSessionLocal | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RoomSessionLocal;
  } catch {
    return null;
  }
}

export function clearRoomSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function loadRoomSessionFor(roomId: string): RoomSessionLocal | null {
  const session = loadRoomSession();
  if (!session || session.roomId !== roomId) {
    return null;
  }
  return session;
}
