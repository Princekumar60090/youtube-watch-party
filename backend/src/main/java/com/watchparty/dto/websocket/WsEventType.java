package com.watchparty.dto.websocket;

public enum WsEventType {
    SYNC_STATE,
    PLAY,
    PAUSE,
    SEEK,
    TIME_SYNC,
    CHANGE_VIDEO,
    USER_JOINED,
    USER_LEFT,
    ROLE_ASSIGNED,
    PARTICIPANT_REMOVED,
    HOST_TRANSFERRED,
    CHAT_PERMISSIONS,
    CHAT_MESSAGE,
    REACTION,
    ERROR
}
