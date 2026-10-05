export type RoomRole = 'HOST' | 'MODERATOR' | 'PARTICIPANT' | 'VIEWER';

export type PlayState = 'playing' | 'paused';

export type Participant = {
  userId: string;
  username: string;
  role: RoomRole;
  joinedAt: string;
};

export type Room = {
  roomId: string;
  roomCode: string;
  hostUserId: string;
  videoId: string | null;
  playState: PlayState | string;
  currentTime: number;
  active: boolean;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
};

export type RoomSession = {
  userId: string;
  username: string;
  role: RoomRole;
  room: Room;
};

export type RoomSessionLocal = {
  roomId: string;
  roomCode: string;
  userId: string;
  username: string;
  role: RoomRole;
};

export type WsEventType =
  | 'SYNC_STATE'
  | 'PLAY'
  | 'PAUSE'
  | 'SEEK'
  | 'CHANGE_VIDEO'
  | 'USER_JOINED'
  | 'USER_LEFT'
  | 'ROLE_ASSIGNED'
  | 'PARTICIPANT_REMOVED'
  | 'HOST_TRANSFERRED'
  | 'ERROR';

export type PlaybackState = {
  videoId: string | null;
  playState: PlayState | string;
  currentTime: number;
};

export type WsRoomEvent = {
  type: WsEventType;
  roomId?: string | null;
  actorUserId?: string | null;
  actorUsername?: string | null;
  targetUserId?: string | null;
  message?: string | null;
  state?: PlaybackState | null;
  participants?: Participant[] | null;
  timestamp?: string | null;
};

export function canControlPlayback(role: RoomRole): boolean {
  return role === 'HOST' || role === 'MODERATOR';
}

export function canManageRoom(role: RoomRole): boolean {
  return role === 'HOST';
}
