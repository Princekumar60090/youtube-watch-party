package com.watchparty.dto.response;

import java.time.Instant;

public record HealthResponse(
        String status,
        String application,
        String activeProfiles,
        boolean mongodbEnabled,
        Instant timestamp
) {
}
