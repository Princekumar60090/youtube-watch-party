package com.watchparty.dto.websocket;

public record ReactionPayload(
        String reactionId,
        String emoji,
        String senderUserId,
        String senderUsername
) {
}
