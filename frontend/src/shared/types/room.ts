export type RoomRole = 'HOST' | 'MODERATOR' | 'PARTICIPANT' | 'VIEWER';

export type PlayState = 'playing' | 'paused';

export type ChatChannel = 'HOST' | 'EVERYONE';

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
  | 'TIME_SYNC'
  | 'CHANGE_VIDEO'
  | 'USER_JOINED'
  | 'USER_LEFT'
  | 'ROLE_ASSIGNED'
  | 'PARTICIPANT_REMOVED'
  | 'HOST_TRANSFERRED'
  | 'CHAT_PERMISSIONS'
  | 'CHAT_MESSAGE'
  | 'REACTION'
  | 'ERROR';

export type PlaybackState = {
  videoId: string | null;
  playState: PlayState | string;
  currentTime: number;
};

export type ChatPermissions = {
  chatWithHostEnabled: boolean;
  chatWithEveryoneEnabled: boolean;
  reactionsEnabled: boolean;
};

export type ChatMessage = {
  messageId: string;
  channel: ChatChannel | string;
  text: string;
  senderUserId: string;
  senderUsername: string;
  timestamp?: string | null;
};

export type ReactionEvent = {
  reactionId: string;
  emoji: string;
  senderUserId: string;
  senderUsername: string;
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
  permissions?: ChatPermissions | null;
  chat?: ChatMessage | null;
  reaction?: ReactionEvent | null;
  timestamp?: string | null;
};

export const REACTION_EMOJIS = ['👍', '👏', '❤️', '😂', '😮', '🔥', '🎉', '😢'] as const;

export function canControlPlayback(role: RoomRole): boolean {
  return role === 'HOST' || role === 'MODERATOR';
}

export function canManageRoom(role: RoomRole): boolean {
  return role === 'HOST';
}
