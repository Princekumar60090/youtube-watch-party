package com.watchparty.websocket;

import java.util.Map;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

/**
 * Assigns a principal based on the WebSocket session id so user-queue messages work.
 */
@Component
@ConditionalOnProperty(name = "app.mongodb.enabled", havingValue = "true")
public class WebSocketConnectInterceptor implements ChannelInterceptor {

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String sessionId = accessor.getSessionId();
            if (sessionId != null) {
                accessor.setUser(new StompPrincipal(sessionId));
            }
            Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
            if (sessionAttributes != null) {
                sessionAttributes.putIfAbsent("connectedAt", System.currentTimeMillis());
            }
        }

        return message;
    }
}
