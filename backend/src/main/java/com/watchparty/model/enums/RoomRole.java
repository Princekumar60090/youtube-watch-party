package com.watchparty.model.enums;

/**
 * Room roles used across REST and WebSocket flows.
 * Viewer is treated as an alias of Participant when needed by the client.
 */
public enum RoomRole {
    HOST,
    MODERATOR,
    PARTICIPANT,
    VIEWER;

    public boolean canControlPlayback() {
        return this == HOST || this == MODERATOR;
    }

    public boolean canManageRoles() {
        return this == HOST;
    }

    public boolean canRemoveParticipants() {
        return this == HOST;
    }
}
