package com.watchparty.dto.websocket;

import com.watchparty.model.enums.RoomRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AssignRoleWsRequest(
        @NotBlank(message = "Room id is required")
        String roomId,

        @NotBlank(message = "Target user id is required")
        String userId,

        @NotNull(message = "Role is required")
        RoomRole role
) {
}
