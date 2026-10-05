package com.watchparty.websocket;

import com.watchparty.dto.websocket.ChatPermissionsPayload;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * In-memory room interaction flags (chat / reactions). Never persisted to MongoDB.
 */
@Component
@ConditionalOnProperty(name = "app.mongodb.enabled", havingValue = "true")
public class RoomInteractionStore {

    private final ConcurrentHashMap<String, MutablePermissions> byRoomId = new ConcurrentHashMap<>();

    public ChatPermissionsPayload getPermissions(String roomId) {
        MutablePermissions current = byRoomId.get(roomId);
        if (current == null) {
            return ChatPermissionsPayload.disabled();
        }
        return current.toPayload();
    }

    public ChatPermissionsPayload updatePermissions(
            String roomId,
            Boolean chatWithHostEnabled,
            Boolean chatWithEveryoneEnabled,
            Boolean reactionsEnabled
    ) {
        MutablePermissions updated = byRoomId.compute(roomId, (id, existing) -> {
            MutablePermissions next = existing == null ? new MutablePermissions() : existing;
            if (chatWithHostEnabled != null) {
                next.chatWithHostEnabled = chatWithHostEnabled;
            }
            if (chatWithEveryoneEnabled != null) {
                next.chatWithEveryoneEnabled = chatWithEveryoneEnabled;
            }
            if (reactionsEnabled != null) {
                next.reactionsEnabled = reactionsEnabled;
            }
            return next;
        });
        return updated.toPayload();
    }

    public void clearRoom(String roomId) {
        byRoomId.remove(roomId);
    }

    private static final class MutablePermissions {
        private volatile boolean chatWithHostEnabled;
        private volatile boolean chatWithEveryoneEnabled;
        private volatile boolean reactionsEnabled;

        private ChatPermissionsPayload toPayload() {
            return new ChatPermissionsPayload(
                    chatWithHostEnabled,
                    chatWithEveryoneEnabled,
                    reactionsEnabled
            );
        }
    }
}
