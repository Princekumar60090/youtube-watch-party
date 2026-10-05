package com.watchparty.websocket;

import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Tracks which WebSocket sessions are currently connected inside each room.
 */
@Component
@ConditionalOnProperty(name = "app.mongodb.enabled", havingValue = "true")
public class RoomPresenceTracker {

    private final Map<String, Presence> sessionsById = new ConcurrentHashMap<>();

    public void connect(String sessionId, String roomId, String userId, String username) {
        sessionsById.put(sessionId, new Presence(roomId, userId, username));
    }

    public Optional<Presence> disconnect(String sessionId) {
        return Optional.ofNullable(sessionsById.remove(sessionId));
    }

    public Optional<Presence> findBySessionId(String sessionId) {
        return Optional.ofNullable(sessionsById.get(sessionId));
    }

    public Set<String> sessionIdsForUser(String roomId, String userId) {
        return sessionsById.entrySet().stream()
                .filter(entry -> entry.getValue().roomId().equals(roomId))
                .filter(entry -> entry.getValue().userId().equals(userId))
                .map(Map.Entry::getKey)
                .collect(Collectors.toSet());
    }

    public boolean isOnline(String roomId, String userId) {
        return sessionsById.values().stream()
                .anyMatch(presence -> presence.roomId().equals(roomId) && presence.userId().equals(userId));
    }

    public record Presence(String roomId, String userId, String username) {
    }
}
