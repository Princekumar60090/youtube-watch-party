package com.watchparty.dto.websocket;

import jakarta.validation.constraints.NotBlank;

public record TransferHostWsRequest(
        @NotBlank(message = "Room id is required")
        String roomId,

        @NotBlank(message = "Target user id is required")
        String userId
) {
}
