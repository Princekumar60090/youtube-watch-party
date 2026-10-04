package com.watchparty.dto.response;

import com.watchparty.model.enums.RoomRole;

/**
 * Returned after create/join so the client knows the caller's identity in that room.
 */
public record RoomSessionResponse(
        String userId,
        String username,
        RoomRole role,
        RoomResponse room
) {
}
