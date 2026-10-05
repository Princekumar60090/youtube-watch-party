package com.watchparty.websocket;

import com.watchparty.dto.websocket.WsRoomEvent;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.mongodb.enabled", havingValue = "true")
public class WsEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public WsEventPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void sendToRoom(String roomId, WsRoomEvent event) {
        messagingTemplate.convertAndSend(roomTopic(roomId), event);
    }

    public void sendToSession(String sessionId, WsRoomEvent event) {
        messagingTemplate.convertAndSendToUser(sessionId, "/queue/room", event);
    }

    public static String roomTopic(String roomId) {
        return "/topic/rooms/" + roomId;
    }
}
