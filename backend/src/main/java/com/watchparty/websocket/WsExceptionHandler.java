package com.watchparty.websocket;

import com.watchparty.dto.websocket.WsEventType;
import com.watchparty.dto.websocket.WsRoomEvent;
import com.watchparty.exception.ApiException;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.messaging.handler.annotation.support.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;

@ControllerAdvice
@ConditionalOnProperty(name = "app.mongodb.enabled", havingValue = "true")
public class WsExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(WsExceptionHandler.class);

    @MessageExceptionHandler(ApiException.class)
    @SendToUser("/queue/errors")
    public WsRoomEvent handleApiException(ApiException ex) {
        return errorEvent(ex.getMessage());
    }

    @MessageExceptionHandler({
            MethodArgumentNotValidException.class,
            ConstraintViolationException.class,
            IllegalArgumentException.class
    })
    @SendToUser("/queue/errors")
    public WsRoomEvent handleValidation(Exception ex) {
        return errorEvent(ex.getMessage() == null ? "Invalid WebSocket payload" : ex.getMessage());
    }

    @MessageExceptionHandler(Exception.class)
    @SendToUser("/queue/errors")
    public WsRoomEvent handleGeneric(Exception ex) {
        log.error("Unhandled WebSocket exception", ex);
        return errorEvent("Unexpected WebSocket error");
    }

    private WsRoomEvent errorEvent(String message) {
        return WsRoomEvent.of(
                WsEventType.ERROR,
                null,
                null,
                null,
                null,
                message,
                null,
                null
        );
    }
}
