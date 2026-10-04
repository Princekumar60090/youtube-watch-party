package com.watchparty.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * STOMP-over-WebSocket foundation for Part 3 realtime sync.
 * Controllers/handlers will be added later; this only registers the endpoint and broker.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final AppProperties appProperties;

    public WebSocketConfig(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] patterns = appProperties.getWebsocket()
                .resolvedAllowedOriginPatterns()
                .toArray(String[]::new);

        registry.addEndpoint(appProperties.getWebsocket().getEndpoint())
                .setAllowedOriginPatterns(patterns)
                .withSockJS();

        registry.addEndpoint(appProperties.getWebsocket().getEndpoint())
                .setAllowedOriginPatterns(patterns);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }
}
