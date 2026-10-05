import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import { env } from '@/shared/config/env';
import type { RoomRole, WsRoomEvent } from '@/shared/types/room';
import { wsDestinations } from '@/shared/ws/wsClient';

function toWebSocketUrl(url: string): string {
  if (url.startsWith('https://')) return url.replace(/^https/, 'wss');
  if (url.startsWith('http://')) return url.replace(/^http/, 'ws');
  return url;
}

export type RoomSocketHandlers = {
  onEvent: (event: WsRoomEvent) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (message: string) => void;
};

export class StompRoomClient {
  private client: Client | null = null;
  private subscriptions: StompSubscription[] = [];
  private roomId: string | null = null;
  /** Bumps on every connect/disconnect so stale socket callbacks are ignored. */
  private generation = 0;
  private intentionalClose = false;

  connect(roomId: string, userId: string, handlers: RoomSocketHandlers): void {
    this.disconnect();
    this.intentionalClose = false;
    const generation = ++this.generation;
    this.roomId = roomId;

    const client = new Client({
      brokerURL: toWebSocketUrl(env.wsUrl),
      reconnectDelay: 5000,
      connectionTimeout: 20000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        if (generation !== this.generation) {
          return;
        }

        this.subscriptions.forEach((sub) => sub.unsubscribe());
        this.subscriptions = [];

        const onMessage = (message: IMessage) => {
          if (generation !== this.generation) {
            return;
          }
          try {
            const event = JSON.parse(message.body) as WsRoomEvent;
            handlers.onEvent(event);
          } catch {
            handlers.onError?.('Failed to parse room event');
          }
        };

        this.subscriptions.push(
          client.subscribe(wsDestinations.roomTopic(roomId), onMessage),
          client.subscribe(wsDestinations.personalQueue, onMessage),
          client.subscribe(wsDestinations.errorQueue, onMessage),
        );

        client.publish({
          destination: wsDestinations.join,
          body: JSON.stringify({ roomId, userId }),
          headers: { 'content-type': 'application/json' },
        });

        handlers.onConnected?.();
      },
      onStompError: (frame) => {
        if (generation !== this.generation) {
          return;
        }
        handlers.onError?.(frame.headers.message || 'WebSocket connection error');
      },
      onWebSocketClose: () => {
        if (generation !== this.generation || this.intentionalClose) {
          return;
        }
        handlers.onDisconnected?.();
      },
      onWebSocketError: () => {
        if (generation !== this.generation) {
          return;
        }
        handlers.onError?.('WebSocket connection error');
      },
    });

    this.client = client;
    client.activate();
  }

  private publish(destination: string, body: unknown): void {
    if (!this.client?.connected) {
      throw new Error(
        'Still connecting to the room. Wait until status shows Live, then try again.',
      );
    }
    this.client.publish({
      destination,
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    });
  }

  leave(roomId: string): void {
    this.publish(wsDestinations.leave, { roomId });
  }

  play(roomId: string, currentTime?: number): void {
    this.publish(wsDestinations.play, { roomId, currentTime });
  }

  pause(roomId: string, currentTime?: number): void {
    this.publish(wsDestinations.pause, { roomId, currentTime });
  }

  seek(roomId: string, time: number): void {
    this.publish(wsDestinations.seek, { roomId, time });
  }

  changeVideo(roomId: string, videoId: string): void {
    this.publish(wsDestinations.changeVideo, { roomId, videoId });
  }

  assignRole(roomId: string, userId: string, role: RoomRole): void {
    this.publish(wsDestinations.assignRole, { roomId, userId, role });
  }

  removeParticipant(roomId: string, userId: string): void {
    this.publish(wsDestinations.removeParticipant, { roomId, userId });
  }

  transferHost(roomId: string, userId: string): void {
    this.publish(wsDestinations.transferHost, { roomId, userId });
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.generation += 1;
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
    const client = this.client;
    this.client = null;
    this.roomId = null;
    if (client) {
      client.reconnectDelay = 0;
      void client.deactivate();
    }
  }

  get activeRoomId(): string | null {
    return this.roomId;
  }

  get isConnected(): boolean {
    return Boolean(this.client?.connected);
  }
}
