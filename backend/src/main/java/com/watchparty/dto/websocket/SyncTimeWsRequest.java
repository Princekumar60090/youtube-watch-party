package com.watchparty.dto.websocket;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SyncTimeWsRequest(
        @NotBlank(message = "Room id is required")
        String roomId,
        @NotNull(message = "Time is required")
        @DecimalMin(value = "0.0", message = "Time must be >= 0")
        Double time
) {
}
