package com.watchparty.dto.websocket;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SendReactionWsRequest(
        @NotBlank(message = "Room id is required")
        String roomId,
        @NotBlank(message = "Emoji is required")
        @Size(max = 16, message = "Emoji is too long")
        String emoji
) {
}
