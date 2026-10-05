package com.watchparty.dto.websocket;

import jakarta.validation.constraints.NotBlank;

public record ChangeVideoWsRequest(
        @NotBlank(message = "Room id is required")
        String roomId,

        @NotBlank(message = "videoId is required")
        String videoId
) {
}
