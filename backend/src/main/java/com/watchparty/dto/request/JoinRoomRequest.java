package com.watchparty.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record JoinRoomRequest(
        @NotBlank(message = "Username is required")
        @Size(min = 2, max = 24, message = "Username must be between 2 and 24 characters")
        @Pattern(
                regexp = "^[A-Za-z0-9_ ]+$",
                message = "Username may contain only letters, numbers, spaces, and underscores"
        )
        String username
) {
}
