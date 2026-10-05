package com.watchparty.service;

import com.watchparty.dto.response.ParticipantResponse;
import com.watchparty.dto.websocket.AssignRoleWsRequest;
import com.watchparty.dto.websocket.ChangeVideoWsRequest;
import com.watchparty.dto.websocket.ChatMessagePayload;
import com.watchparty.dto.websocket.ChatPermissionsPayload;
import com.watchparty.dto.websocket.JoinRoomWsRequest;
import com.watchparty.dto.websocket.LeaveRoomWsRequest;
import com.watchparty.dto.websocket.PlaybackControlWsRequest;
import com.watchparty.dto.websocket.PlaybackStatePayload;
import com.watchparty.dto.websocket.ReactionPayload;
import com.watchparty.dto.websocket.RemoveParticipantWsRequest;
import com.watchparty.dto.websocket.SeekWsRequest;
import com.watchparty.dto.websocket.SendChatWsRequest;
import com.watchparty.dto.websocket.SendReactionWsRequest;
import com.watchparty.dto.websocket.SetChatPermissionsWsRequest;
import com.watchparty.dto.websocket.SyncTimeWsRequest;
import com.watchparty.dto.websocket.TransferHostWsRequest;
import com.watchparty.dto.websocket.WsEventType;
import com.watchparty.dto.websocket.WsRoomEvent;
import com.watchparty.exception.BadRequestException;
import com.watchparty.exception.ForbiddenException;
import com.watchparty.model.document.Participant;
import com.watchparty.model.document.Room;
import com.watchparty.model.enums.RoomRole;
import com.watchparty.websocket.RoomInteractionStore;
import com.watchparty.websocket.RoomPresenceTracker;
import com.watchparty.websocket.WsEventPublisher;
import com.watchparty.websocket.WsSessionKeys;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "app.mongodb.enabled", havingValue = "true")
public class RoomRealtimeService {

    private static final Set<String> ALLOWED_REACTIONS = Set.of(
            "👍", "👏", "❤️", "😂", "😮", "🔥", "🎉", "😢"
    );

    private final RoomService roomService;
    private final RoomMapper roomMapper;
    private final RoomPresenceTracker presenceTracker;
    private final RoomInteractionStore interactionStore;
    private final WsEventPublisher eventPublisher;

    public RoomRealtimeService(
            RoomService roomService,
            RoomMapper roomMapper,
            RoomPresenceTracker presenceTracker,
            RoomInteractionStore interactionStore,
            WsEventPublisher eventPublisher
    ) {
        this.roomService = roomService;
        this.roomMapper = roomMapper;
        this.presenceTracker = presenceTracker;
        this.interactionStore = interactionStore;
        this.eventPublisher = eventPublisher;
    }

    public void joinRoom(JoinRoomWsRequest request, SimpMessageHeaderAccessor accessor) {
        String sessionId = requireSessionId(accessor);
        Room room = roomService.requireActiveRoom(request.roomId());
        Participant participant = roomService.requireParticipant(room, request.userId());

        accessor.getSessionAttributes().put(WsSessionKeys.ROOM_ID, room.getId());
        accessor.getSessionAttributes().put(WsSessionKeys.USER_ID, participant.getUserId());
        accessor.getSessionAttributes().put(WsSessionKeys.USERNAME, participant.getUsername());
        presenceTracker.connect(sessionId, room.getId(), participant.getUserId(), participant.getUsername());

        PlaybackStatePayload state = toState(room);
        List<ParticipantResponse> participants = toParticipants(room);
        ChatPermissionsPayload permissions = interactionStore.getPermissions(room.getId());

        WsRoomEvent syncEvent = WsRoomEvent.of(
                WsEventType.SYNC_STATE,
                room.getId(),
                participant.getUserId(),
                participant.getUsername(),
                null,
                "Room state synchronized",
                state,
                participants,
                permissions,
                null,
                null
        );
        eventPublisher.sendToSession(sessionId, syncEvent);

        WsRoomEvent joinedEvent = WsRoomEvent.of(
                WsEventType.USER_JOINED,
                room.getId(),
                participant.getUserId(),
                participant.getUsername(),
                participant.getUserId(),
                participant.getUsername() + " joined the room",
                state,
                participants
        );
        eventPublisher.sendToRoom(room.getId(), joinedEvent);
    }

    public void leaveRoom(LeaveRoomWsRequest request, SimpMessageHeaderAccessor accessor) {
        SessionActor actor = requireActorInRoom(accessor, request.roomId());
        handleLeave(accessor.getSessionId(), actor.roomId(), actor.userId(), actor.username(), false);
        clearSession(accessor);
    }

    public void handleDisconnect(String sessionId) {
        presenceTracker.disconnect(sessionId).ifPresent(presence ->
                handleLeave(sessionId, presence.roomId(), presence.userId(), presence.username(), true)
        );
    }

    public void play(PlaybackControlWsRequest request, SimpMessageHeaderAccessor accessor) {
        SessionActor actor = requireActorInRoom(accessor, request.roomId());
        Room room = roomService.updatePlayback(
                actor.roomId(),
                actor.userId(),
                "playing",
                request.currentTime()
        );
        broadcastControl(WsEventType.PLAY, room, actor, null, "Playback started");
    }

    public void pause(PlaybackControlWsRequest request, SimpMessageHeaderAccessor accessor) {
        SessionActor actor = requireActorInRoom(accessor, request.roomId());
        Room room = roomService.updatePlayback(
                actor.roomId(),
                actor.userId(),
                "paused",
                request.currentTime()
        );
        broadcastControl(WsEventType.PAUSE, room, actor, null, "Playback paused");
    }

    public void seek(SeekWsRequest request, SimpMessageHeaderAccessor accessor) {
        SessionActor actor = requireActorInRoom(accessor, request.roomId());
        Room room = roomService.seek(actor.roomId(), actor.userId(), request.time());
        broadcastControl(WsEventType.SEEK, room, actor, null, "Seek updated");
    }

    public void changeVideo(ChangeVideoWsRequest request, SimpMessageHeaderAccessor accessor) {
        SessionActor actor = requireActorInRoom(accessor, request.roomId());
        Room room = roomService.changeVideo(actor.roomId(), actor.userId(), request.videoId());
        broadcastControl(WsEventType.CHANGE_VIDEO, room, actor, null, "Video changed");
    }

    public void assignRole(AssignRoleWsRequest request, SimpMessageHeaderAccessor accessor) {
        SessionActor actor = requireActorInRoom(accessor, request.roomId());
        Room room = roomService.assignRole(actor.roomId(), actor.userId(), request.userId(), request.role());
        broadcastControl(
                WsEventType.ROLE_ASSIGNED,
                room,
                actor,
                request.userId(),
                "Role updated"
        );
    }

    public void removeParticipant(RemoveParticipantWsRequest request, SimpMessageHeaderAccessor accessor) {
        SessionActor actor = requireActorInRoom(accessor, request.roomId());
        Room room = roomService.removeParticipant(actor.roomId(), actor.userId(), request.userId());

        Set<String> targetSessions = presenceTracker.sessionIdsForUser(room.getId(), request.userId());
        for (String targetSessionId : targetSessions) {
            presenceTracker.disconnect(targetSessionId);
            eventPublisher.sendToSession(
                    targetSessionId,
                    WsRoomEvent.of(
                            WsEventType.ERROR,
                            room.getId(),
                            actor.userId(),
                            actor.username(),
                            request.userId(),
                            "You were removed from the room by the host",
                            toState(room),
                            toParticipants(room)
                    )
            );
        }

        broadcastControl(
                WsEventType.PARTICIPANT_REMOVED,
                room,
                actor,
                request.userId(),
                "Participant removed"
        );
    }

    public void transferHost(TransferHostWsRequest request, SimpMessageHeaderAccessor accessor) {
        SessionActor actor = requireActorInRoom(accessor, request.roomId());
        Room room = roomService.transferHost(actor.roomId(), actor.userId(), request.userId());
        broadcastControl(
                WsEventType.HOST_TRANSFERRED,
                room,
                actor,
                request.userId(),
                "Host transferred"
        );
    }

    public void syncTime(SyncTimeWsRequest request, SimpMessageHeaderAccessor accessor) {
        SessionActor actor = requireActorInRoom(accessor, request.roomId());
        Room room = roomService.seek(actor.roomId(), actor.userId(), request.time());
        eventPublisher.sendToRoom(
                room.getId(),
                WsRoomEvent.of(
                        WsEventType.TIME_SYNC,
                        room.getId(),
                        actor.userId(),
                        actor.username(),
                        null,
                        null,
                        toState(room),
                        null
                )
        );
    }

    public void setChatPermissions(SetChatPermissionsWsRequest request, SimpMessageHeaderAccessor accessor) {
        SessionActor actor = requireActorInRoom(accessor, request.roomId());
        Room room = roomService.requireActiveRoom(actor.roomId());
        Participant hostActor = roomService.requireParticipant(room, actor.userId());
        if (hostActor.getRole() != RoomRole.HOST) {
            throw new ForbiddenException("Only the host can change chat and reaction permissions");
        }
        if (request.chatWithHostEnabled() == null
                && request.chatWithEveryoneEnabled() == null
                && request.reactionsEnabled() == null) {
            throw new BadRequestException("Provide at least one permission to update");
        }

        ChatPermissionsPayload permissions = interactionStore.updatePermissions(
                room.getId(),
                request.chatWithHostEnabled(),
                request.chatWithEveryoneEnabled(),
                request.reactionsEnabled()
        );

        eventPublisher.sendToRoom(
                room.getId(),
                WsRoomEvent.of(
                        WsEventType.CHAT_PERMISSIONS,
                        room.getId(),
                        actor.userId(),
                        actor.username(),
                        null,
                        "Chat permissions updated",
                        null,
                        null,
                        permissions,
                        null,
                        null
                )
        );
    }

    public void sendChat(SendChatWsRequest request, SimpMessageHeaderAccessor accessor) {
        SessionActor actor = requireActorInRoom(accessor, request.roomId());
        Room room = roomService.requireActiveRoom(actor.roomId());
        roomService.requireParticipant(room, actor.userId());

        String channel = normalizeChatChannel(request.channel());
        String text = request.text() == null ? "" : request.text().trim();
        if (text.isEmpty()) {
            throw new BadRequestException("Message cannot be empty");
        }
        if (text.length() > 300) {
            throw new BadRequestException("Message must be at most 300 characters");
        }

        ChatPermissionsPayload permissions = interactionStore.getPermissions(room.getId());
        boolean isHost = actor.userId().equals(room.getHostUserId());

        if ("EVERYONE".equals(channel)) {
            if (!permissions.chatWithEveryoneEnabled() && !isHost) {
                throw new ForbiddenException("The host has not enabled chat with everyone");
            }
        } else if ("HOST".equals(channel)) {
            if (!permissions.chatWithHostEnabled() && !isHost) {
                throw new ForbiddenException("The host has not enabled chat with host");
            }
        } else {
            throw new BadRequestException("Channel must be HOST or EVERYONE");
        }

        ChatMessagePayload chat = new ChatMessagePayload(
                UUID.randomUUID().toString(),
                channel,
                text,
                actor.userId(),
                actor.username()
        );

        WsRoomEvent event = WsRoomEvent.of(
                WsEventType.CHAT_MESSAGE,
                room.getId(),
                actor.userId(),
                actor.username(),
                null,
                null,
                null,
                null,
                null,
                chat,
                null
        );

        if ("EVERYONE".equals(channel)) {
            eventPublisher.sendToRoom(room.getId(), event);
            return;
        }

        // Host channel stays private between the sender and the host (ephemeral, not stored).
        Set<String> recipients = new HashSet<>();
        recipients.addAll(presenceTracker.sessionIdsForUser(room.getId(), room.getHostUserId()));
        recipients.addAll(presenceTracker.sessionIdsForUser(room.getId(), actor.userId()));
        for (String sessionId : recipients) {
            eventPublisher.sendToSession(sessionId, event);
        }
    }

    public void sendReaction(SendReactionWsRequest request, SimpMessageHeaderAccessor accessor) {
        SessionActor actor = requireActorInRoom(accessor, request.roomId());
        Room room = roomService.requireActiveRoom(actor.roomId());
        roomService.requireParticipant(room, actor.userId());

        ChatPermissionsPayload permissions = interactionStore.getPermissions(room.getId());
        boolean isHost = actor.userId().equals(room.getHostUserId());
        if (!permissions.reactionsEnabled() && !isHost) {
            throw new ForbiddenException("The host has not enabled reactions");
        }

        String emoji = request.emoji() == null ? "" : request.emoji().trim();
        if (!ALLOWED_REACTIONS.contains(emoji)) {
            throw new BadRequestException("That reaction is not allowed");
        }

        ReactionPayload reaction = new ReactionPayload(
                UUID.randomUUID().toString(),
                emoji,
                actor.userId(),
                actor.username()
        );

        eventPublisher.sendToRoom(
                room.getId(),
                WsRoomEvent.of(
                        WsEventType.REACTION,
                        room.getId(),
                        actor.userId(),
                        actor.username(),
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        reaction
                )
        );
    }

    private String normalizeChatChannel(String channel) {
        if (channel == null) {
            return "";
        }
        return channel.trim().toUpperCase(Locale.ROOT);
    }

    private void handleLeave(
            String sessionId,
            String roomId,
            String userId,
            String username,
            boolean fromDisconnect
    ) {
        // If user still has another active tab/session, do not broadcast leave yet.
        if (presenceTracker.isOnline(roomId, userId) && fromDisconnect) {
            return;
        }
        if (!fromDisconnect) {
            presenceTracker.disconnect(sessionId);
            if (presenceTracker.isOnline(roomId, userId)) {
                return;
            }
        }

        Room room;
        try {
            room = roomService.requireActiveRoom(roomId);
        } catch (RuntimeException ex) {
            return;
        }

        eventPublisher.sendToRoom(
                roomId,
                WsRoomEvent.of(
                        WsEventType.USER_LEFT,
                        roomId,
                        userId,
                        username,
                        userId,
                        username + " left the room",
                        toState(room),
                        toParticipants(room)
                )
        );
    }

    private void broadcastControl(
            WsEventType type,
            Room room,
            SessionActor actor,
            String targetUserId,
            String message
    ) {
        eventPublisher.sendToRoom(
                room.getId(),
                WsRoomEvent.of(
                        type,
                        room.getId(),
                        actor.userId(),
                        actor.username(),
                        targetUserId,
                        message,
                        toState(room),
                        toParticipants(room)
                )
        );

        // Keep explicit sync_state event as defined in the assignment.
        if (type == WsEventType.PLAY
                || type == WsEventType.PAUSE
                || type == WsEventType.SEEK
                || type == WsEventType.CHANGE_VIDEO) {
            eventPublisher.sendToRoom(
                    room.getId(),
                    WsRoomEvent.of(
                            WsEventType.SYNC_STATE,
                            room.getId(),
                            actor.userId(),
                            actor.username(),
                            null,
                            "Room state synchronized",
                            toState(room),
                            null
                    )
            );
        }
    }

    private SessionActor requireActorInRoom(SimpMessageHeaderAccessor accessor, String roomId) {
        if (roomId == null || roomId.isBlank()) {
            throw new BadRequestException("Room id is required");
        }

        String sessionId = requireSessionId(accessor);
        RoomPresenceTracker.Presence presence = presenceTracker.findBySessionId(sessionId)
                .orElse(null);

        String sessionRoomId = presence != null ? presence.roomId() : stringAttr(accessor, WsSessionKeys.ROOM_ID);
        String userId = presence != null ? presence.userId() : stringAttr(accessor, WsSessionKeys.USER_ID);
        String username = presence != null ? presence.username() : stringAttr(accessor, WsSessionKeys.USERNAME);

        if (sessionRoomId == null || userId == null || username == null) {
            throw new ForbiddenException("Join the room over WebSocket before sending events");
        }
        if (!sessionRoomId.equals(roomId.trim())) {
            throw new ForbiddenException("Session is not joined to this room");
        }

        // Keep session attributes in sync for disconnect/leave flows.
        if (accessor.getSessionAttributes() != null) {
            accessor.getSessionAttributes().put(WsSessionKeys.ROOM_ID, sessionRoomId);
            accessor.getSessionAttributes().put(WsSessionKeys.USER_ID, userId);
            accessor.getSessionAttributes().put(WsSessionKeys.USERNAME, username);
        }

        return new SessionActor(sessionRoomId, userId, username);
    }

    private String requireSessionId(SimpMessageHeaderAccessor accessor) {
        String sessionId = accessor.getSessionId();
        if (sessionId == null || sessionId.isBlank()) {
            throw new BadRequestException("Missing WebSocket session");
        }
        return sessionId;
    }

    private void clearSession(SimpMessageHeaderAccessor accessor) {
        if (accessor.getSessionAttributes() != null) {
            accessor.getSessionAttributes().remove(WsSessionKeys.ROOM_ID);
            accessor.getSessionAttributes().remove(WsSessionKeys.USER_ID);
            accessor.getSessionAttributes().remove(WsSessionKeys.USERNAME);
        }
    }

    private String stringAttr(SimpMessageHeaderAccessor accessor, String key) {
        if (accessor.getSessionAttributes() == null) {
            return null;
        }
        Object value = accessor.getSessionAttributes().get(key);
        return value == null ? null : String.valueOf(value);
    }

    private PlaybackStatePayload toState(Room room) {
        return new PlaybackStatePayload(room.getVideoId(), room.getPlayState(), room.getCurrentTime());
    }

    private List<ParticipantResponse> toParticipants(Room room) {
        return roomMapper.toRoomResponse(room).participants();
    }

    private record SessionActor(String roomId, String userId, String username) {
    }
}
