package com.watchparty.service;

import com.watchparty.config.AppProperties;
import com.watchparty.dto.response.HealthResponse;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

@Service
public class HealthInfoService {

    private final Environment environment;
    private final AppProperties appProperties;
    private final String applicationName;

    public HealthInfoService(
            Environment environment,
            AppProperties appProperties,
            @Value("${spring.application.name}") String applicationName
    ) {
        this.environment = environment;
        this.appProperties = appProperties;
        this.applicationName = applicationName;
    }

    public HealthResponse getHealth() {
        return new HealthResponse(
                "UP",
                applicationName,
                String.join(",", environment.getActiveProfiles()),
                appProperties.getMongodb().isEnabled(),
                Instant.now()
        );
    }
}
