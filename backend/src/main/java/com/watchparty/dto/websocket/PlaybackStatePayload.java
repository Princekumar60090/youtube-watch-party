package com.watchparty.dto.websocket;

public record PlaybackStatePayload(
        String videoId,
        String playState,
        double currentTime
) {
}
