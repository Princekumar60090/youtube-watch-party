package com.watchparty.dto.websocket;

import jakarta.validation.constraints.NotBlank;

public record LeaveRoomWsRequest(
        @NotBlank(message = "Room id is required")
        String roomId
) {
}
