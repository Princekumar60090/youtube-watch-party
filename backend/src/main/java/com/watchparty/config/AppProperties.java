package com.watchparty.config;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private final Api api = new Api();
    private final Cors cors = new Cors();
    private final Websocket websocket = new Websocket();
    private final Mongodb mongodb = new Mongodb();

    public Api getApi() {
        return api;
    }

    public Cors getCors() {
        return cors;
    }

    public Websocket getWebsocket() {
        return websocket;
    }

    public Mongodb getMongodb() {
        return mongodb;
    }

    public static class Api {
        private String basePath = "/api/v1";

        public String getBasePath() {
            return basePath;
        }

        public void setBasePath(String basePath) {
            this.basePath = basePath;
        }
    }

    public static class Cors {
        private String allowedOrigins = "http://localhost:5173";
        private String allowedMethods = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
        private String allowedHeaders = "*";
        private boolean allowCredentials = true;

        public List<String> resolvedAllowedOrigins() {
            return splitCsv(allowedOrigins);
        }

        public List<String> resolvedAllowedMethods() {
            return splitCsv(allowedMethods);
        }

        public String getAllowedOrigins() {
            return allowedOrigins;
        }

        public void setAllowedOrigins(String allowedOrigins) {
            this.allowedOrigins = allowedOrigins;
        }

        public String getAllowedMethods() {
            return allowedMethods;
        }

        public void setAllowedMethods(String allowedMethods) {
            this.allowedMethods = allowedMethods;
        }

        public String getAllowedHeaders() {
            return allowedHeaders;
        }

        public void setAllowedHeaders(String allowedHeaders) {
            this.allowedHeaders = allowedHeaders;
        }

        public boolean isAllowCredentials() {
            return allowCredentials;
        }

        public void setAllowCredentials(boolean allowCredentials) {
            this.allowCredentials = allowCredentials;
        }
    }

    public static class Websocket {
        private String endpoint = "/ws";
        private String allowedOriginPatterns = "http://localhost:5173";

        public List<String> resolvedAllowedOriginPatterns() {
            return splitCsv(allowedOriginPatterns);
        }

        public String getEndpoint() {
            return endpoint;
        }

        public void setEndpoint(String endpoint) {
            this.endpoint = endpoint;
        }

        public String getAllowedOriginPatterns() {
            return allowedOriginPatterns;
        }

        public void setAllowedOriginPatterns(String allowedOriginPatterns) {
            this.allowedOriginPatterns = allowedOriginPatterns;
        }
    }

    public static class Mongodb {
        private boolean enabled;

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }
    }

    private static List<String> splitCsv(String value) {
        if (value == null || value.isBlank()) {
            return new ArrayList<>();
        }
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(part -> !part.isEmpty())
                .toList();
    }
}
