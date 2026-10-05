package com.watchparty.dto.websocket;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.watchparty.dto.response.ParticipantResponse;
import java.time.Instant;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record WsRoomEvent(
        WsEventType type,
        String roomId,
        String actorUserId,
        String actorUsername,
        String targetUserId,
        String message,
        PlaybackStatePayload state,
        List<ParticipantResponse> participants,
        Instant timestamp
) {

    public static WsRoomEvent of(
            WsEventType type,
            String roomId,
            String actorUserId,
            String actorUsername,
            String targetUserId,
            String message,
            PlaybackStatePayload state,
            List<ParticipantResponse> participants
    ) {
        return new WsRoomEvent(
                type,
                roomId,
                actorUserId,
                actorUsername,
                targetUserId,
                message,
                state,
                participants,
                Instant.now()
        );
    }
}
