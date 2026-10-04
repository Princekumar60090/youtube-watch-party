package com.watchparty.dto.response;

import java.time.Instant;
import java.util.List;

public record RoomResponse(
        String roomId,
        String roomCode,
        String hostUserId,
        String videoId,
        String playState,
        double currentTime,
        boolean active,
        List<ParticipantResponse> participants,
        Instant createdAt,
        Instant updatedAt
) {
}
