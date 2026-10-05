package com.watchparty.config;

import com.watchparty.websocket.WebSocketConnectInterceptor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final AppProperties appProperties;
    private final ObjectProvider<WebSocketConnectInterceptor> connectInterceptorProvider;

    public WebSocketConfig(
            AppProperties appProperties,
            ObjectProvider<WebSocketConnectInterceptor> connectInterceptorProvider
    ) {
        this.appProperties = appProperties;
        this.connectInterceptorProvider = connectInterceptorProvider;
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
        // Heartbeats keep Render proxies from closing idle WebSocket connections.
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("ws-heartbeat-");
        scheduler.initialize();

        registry.enableSimpleBroker("/topic", "/queue")
                .setHeartbeatValue(new long[] {10_000, 10_000})
                .setTaskScheduler(scheduler);
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        WebSocketConnectInterceptor interceptor = connectInterceptorProvider.getIfAvailable();
        if (interceptor != null) {
            registration.interceptors(interceptor);
        }
    }
}
