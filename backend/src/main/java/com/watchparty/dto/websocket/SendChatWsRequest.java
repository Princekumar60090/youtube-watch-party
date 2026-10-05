package com.watchparty.dto.websocket;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SendChatWsRequest(
        @NotBlank(message = "Room id is required")
        String roomId,
        @NotBlank(message = "Channel is required")
        String channel,
        @NotBlank(message = "Message is required")
        @Size(max = 300, message = "Message must be at most 300 characters")
        String text
) {
}
