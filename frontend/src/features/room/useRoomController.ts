import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '@/shared/api/httpClient';
import { getRoomById } from '@/shared/api/roomApi';
import {
  clearRoomSession,
  loadRoomSessionFor,
  updateLocalRole,
} from '@/shared/session/roomSessionStorage';
import type {
  Participant,
  PlaybackState,
  RoomRole,
  RoomSessionLocal,
  WsRoomEvent,
} from '@/shared/types/room';
import { canControlPlayback, canManageRoom } from '@/shared/types/room';
import { StompRoomClient } from '@/shared/ws/stompRoomClient';

type ConnectionStatus = 'connecting' | 'live' | 'reconnecting' | 'offline';

type Toast = {
  id: number;
  tone: 'info' | 'error' | 'success';
  message: string;
};

export function useRoomController(roomId: string) {
  const session = useMemo(() => loadRoomSessionFor(roomId), [roomId]);
  const socketRef = useRef(new StompRoomClient());
  const toastIdRef = useRef(1);

  const [role, setRole] = useState<RoomRole>(session?.role ?? 'PARTICIPANT');
  const [username] = useState(session?.username ?? '');
  const [userId] = useState(session?.userId ?? '');
  const [roomCode, setRoomCode] = useState(session?.roomCode ?? '');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [playback, setPlayback] = useState<PlaybackState>({
    videoId: null,
    playState: 'paused',
    currentTime: 0,
  });
  const [connection, setConnection] = useState<ConnectionStatus>('connecting');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [bootError, setBootError] = useState<string | null>(
    session ? null : 'Join this room from the home screen first.',
  );

  const pushToast = useCallback((message: string, tone: Toast['tone'] = 'info') => {
    const id = toastIdRef.current++;
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4200);
  }, []);

  const friendlyError = useCallback((message: string | null | undefined): string => {
    const raw = (message || '').toLowerCase();
    if (raw.includes('host or moderator') || raw.includes('control playback')) {
      return 'Only the host or a moderator can control playback. Please wait for them to play or pause the video.';
    }
    if (raw.includes('join the room over websocket')) {
      return 'Connecting to the room… please try again in a moment.';
    }
    if (raw.includes('not a participant')) {
      return 'You are not a member of this room. Please join again from the home page.';
    }
    return message || 'Something went wrong. Please try again.';
  }, []);

  const applyParticipants = useCallback(
    (next: Participant[] | null | undefined, selfUserId: string) => {
      if (!next) return;
      setParticipants(next);
      const me = next.find((participant) => participant.userId === selfUserId);
      if (me) {
        setRole(me.role);
        updateLocalRole(me.role);
      }
    },
    [],
  );

  const handleEventRef = useRef<(event: WsRoomEvent) => void>(() => undefined);
  const pushToastRef = useRef(pushToast);
  pushToastRef.current = pushToast;

  const handleEvent = useCallback(
    (event: WsRoomEvent) => {
      if (event.state) {
        setPlayback({
          videoId: event.state.videoId,
          playState: event.state.playState,
          currentTime: event.state.currentTime,
        });
      }
      if (event.participants) {
        applyParticipants(event.participants, userId);
      }

      switch (event.type) {
        case 'ERROR':
          pushToast(friendlyError(event.message), 'error');
          break;
        case 'USER_JOINED':
          if (event.actorUserId !== userId) {
            pushToast(`${event.actorUsername || 'Someone'} joined`, 'info');
          }
          break;
        case 'USER_LEFT':
          if (event.actorUserId !== userId) {
            pushToast(`${event.actorUsername || 'Someone'} left`, 'info');
          }
          break;
        case 'ROLE_ASSIGNED':
          pushToast(event.message || 'Role updated', 'success');
          break;
        case 'PARTICIPANT_REMOVED':
          if (event.targetUserId === userId) {
            pushToast('You were removed by the host', 'error');
            clearRoomSession();
            window.setTimeout(() => {
              window.location.href = '/';
            }, 1200);
          } else {
            pushToast('Participant removed', 'info');
          }
          break;
        case 'HOST_TRANSFERRED':
          pushToast('Host transferred', 'success');
          break;
        case 'CHANGE_VIDEO':
          pushToast('New video locked in', 'success');
          break;
        default:
          break;
      }
    },
    [applyParticipants, friendlyError, pushToast, userId],
  );

  handleEventRef.current = handleEvent;

  useEffect(() => {
    if (!session) return;

    let cancelled = false;
    const connectUserId = session.userId;

    getRoomById(roomId)
      .then((room) => {
        if (cancelled) return;
        setRoomCode(room.roomCode);
        setParticipants(room.participants);
        setPlayback({
          videoId: room.videoId,
          playState: room.playState,
          currentTime: room.currentTime,
        });
        const me = room.participants.find((participant) => participant.userId === session.userId);
        if (me) {
          setRole(me.role);
          updateLocalRole(me.role);
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message =
          error instanceof ApiError ? error.message : 'Unable to load room details';
        setBootError(message);
      });

    setConnection('connecting');
    socketRef.current.connect(roomId, connectUserId, {
      onEvent: (event) => handleEventRef.current(event),
      onConnected: () => {
        if (!cancelled) {
          setConnection('live');
        }
      },
      onDisconnected: () => {
        if (!cancelled) {
          setConnection('reconnecting');
        }
      },
      onError: (message) => {
        if (!cancelled) {
          setConnection('reconnecting');
          pushToastRef.current(message, 'error');
        }
      },
    });

    return () => {
      cancelled = true;
      socketRef.current.disconnect();
    };
  }, [roomId, session?.userId]);

  const guarded = useCallback(
    (action: () => void) => {
      try {
        action();
      } catch (error) {
        pushToast(error instanceof Error ? error.message : 'Action failed', 'error');
      }
    },
    [pushToast],
  );

  const play = (currentTime?: number) =>
    guarded(() => socketRef.current.play(roomId, currentTime));
  const pause = (currentTime?: number) =>
    guarded(() => socketRef.current.pause(roomId, currentTime));
  const seek = (time: number) => guarded(() => socketRef.current.seek(roomId, time));
  const changeVideo = (videoId: string) =>
    guarded(() => socketRef.current.changeVideo(roomId, videoId));
  const assignRole = (targetUserId: string, nextRole: RoomRole) =>
    guarded(() => socketRef.current.assignRole(roomId, targetUserId, nextRole));
  const removeParticipant = (targetUserId: string) =>
    guarded(() => socketRef.current.removeParticipant(roomId, targetUserId));
  const transferHost = (targetUserId: string) =>
    guarded(() => socketRef.current.transferHost(roomId, targetUserId));

  const leave = () => {
    try {
      socketRef.current.leave(roomId);
    } catch {
      // ignore leave publish failures while exiting
    }
    socketRef.current.disconnect();
    clearRoomSession();
  };

  return {
    session: session as RoomSessionLocal | null,
    bootError,
    role,
    username,
    userId,
    roomCode,
    participants,
    playback,
    connection,
    toasts,
    canControl: canControlPlayback(role),
    canManage: canManageRoom(role),
    play,
    pause,
    seek,
    changeVideo,
    assignRole,
    removeParticipant,
    transferHost,
    leave,
    notify: pushToast,
  };
}
