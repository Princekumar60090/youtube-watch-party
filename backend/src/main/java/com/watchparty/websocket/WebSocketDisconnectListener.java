package com.watchparty.websocket;

import com.watchparty.service.RoomRealtimeService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
@ConditionalOnProperty(name = "app.mongodb.enabled", havingValue = "true")
public class WebSocketDisconnectListener {

    private final RoomRealtimeService roomRealtimeService;

    public WebSocketDisconnectListener(RoomRealtimeService roomRealtimeService) {
        this.roomRealtimeService = roomRealtimeService;
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();
        if (sessionId != null) {
            roomRealtimeService.handleDisconnect(sessionId);
        }
    }
}
