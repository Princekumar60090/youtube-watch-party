package com.watchparty.dto.websocket;

import jakarta.validation.constraints.NotBlank;

public record SetChatPermissionsWsRequest(
        @NotBlank(message = "Room id is required")
        String roomId,
        Boolean chatWithHostEnabled,
        Boolean chatWithEveryoneEnabled,
        Boolean reactionsEnabled
) {
}
