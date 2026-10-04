package com.watchparty.dto.response;

import com.watchparty.model.enums.RoomRole;
import java.time.Instant;

public record ParticipantResponse(
        String userId,
        String username,
        RoomRole role,
        Instant joinedAt
) {
}
