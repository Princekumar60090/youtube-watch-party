import { apiGet, apiPost } from '@/shared/api/httpClient';
import type { Room, RoomSession } from '@/shared/types/room';

export function createRoom(username: string): Promise<RoomSession> {
  return apiPost<RoomSession>('/rooms', { username });
}

export function joinRoomById(roomId: string, username: string): Promise<RoomSession> {
  return apiPost<RoomSession>(`/rooms/${roomId}/join`, { username });
}

export function joinRoomByCode(roomCode: string, username: string): Promise<RoomSession> {
  return apiPost<RoomSession>('/rooms/join', { roomCode, username });
}

export function getRoomById(roomId: string): Promise<Room> {
  return apiGet<Room>(`/rooms/${roomId}`);
}
