package com.watchparty.dto.websocket;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;

public record PlaybackControlWsRequest(
        @NotBlank(message = "Room id is required")
        String roomId,

        @DecimalMin(value = "0.0", message = "currentTime must be >= 0")
        Double currentTime
) {
}
