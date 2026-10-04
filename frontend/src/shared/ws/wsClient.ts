import { env } from '@/shared/config/env';

/**
 * Placeholder WebSocket client entrypoint for Part 3.
 * Real STOMP/SockJS wiring will be added with room sync events.
 */
export function getWebsocketEndpoint(): string {
  return env.wsUrl;
}
