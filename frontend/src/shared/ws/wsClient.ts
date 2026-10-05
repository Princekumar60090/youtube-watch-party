import { env } from '@/shared/config/env';

export function getWebsocketEndpoint(): string {
  return env.wsUrl;
}

export const wsDestinations = {
  join: '/app/room.join',
  leave: '/app/room.leave',
  play: '/app/room.play',
  pause: '/app/room.pause',
  seek: '/app/room.seek',
  changeVideo: '/app/room.changeVideo',
  assignRole: '/app/room.assignRole',
  removeParticipant: '/app/room.removeParticipant',
  transferHost: '/app/room.transferHost',
  roomTopic: (roomId: string) => `/topic/rooms/${roomId}`,
  personalQueue: '/user/queue/room',
  errorQueue: '/user/queue/errors',
} as const;
