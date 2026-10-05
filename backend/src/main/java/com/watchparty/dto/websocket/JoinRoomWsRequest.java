package com.watchparty.dto.websocket;

import jakarta.validation.constraints.NotBlank;

public record JoinRoomWsRequest(
        @NotBlank(message = "Room id is required")
        String roomId,

        @NotBlank(message = "User id is required")
        String userId
) {
}
