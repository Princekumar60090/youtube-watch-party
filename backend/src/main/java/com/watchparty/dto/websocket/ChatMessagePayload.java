package com.watchparty.dto.websocket;

public record ChatMessagePayload(
        String messageId,
        String channel,
        String text,
        String senderUserId,
        String senderUsername
) {
}
