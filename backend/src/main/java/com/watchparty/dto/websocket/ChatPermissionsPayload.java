package com.watchparty.dto.websocket;

public record ChatPermissionsPayload(
        boolean chatWithHostEnabled,
        boolean chatWithEveryoneEnabled,
        boolean reactionsEnabled
) {
    public static ChatPermissionsPayload disabled() {
        return new ChatPermissionsPayload(false, false, false);
    }
}
