package com.watchparty.config;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/**
 * Keeps the app bootable without MongoDB during early development.
 * Mongo auto-configuration is enabled only when {@code MONGODB_ENABLED=true}.
 */
public class MongoAutoConfigExcludeEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final String EXCLUDE_PROPERTY = "spring.autoconfigure.exclude";

    private static final List<String> MONGO_AUTO_CONFIGURATIONS = List.of(
            "org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration",
            "org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration",
            "org.springframework.boot.autoconfigure.data.mongo.MongoRepositoriesAutoConfiguration",
            "org.springframework.boot.actuate.autoconfigure.mongo.MongoHealthContributorAutoConfiguration"
    );

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        if (isMongoExplicitlyEnabled(environment)) {
            return;
        }

        List<String> excludes = new ArrayList<>();
        String existing = environment.getProperty(EXCLUDE_PROPERTY);
        if (existing != null && !existing.isBlank()) {
            Arrays.stream(existing.split(","))
                    .map(String::trim)
                    .filter(value -> !value.isEmpty())
                    .forEach(excludes::add);
        }
        for (String autoConfiguration : MONGO_AUTO_CONFIGURATIONS) {
            if (!excludes.contains(autoConfiguration)) {
                excludes.add(autoConfiguration);
            }
        }

        Map<String, Object> properties = new HashMap<>();
        // Indexed form binds reliably as a list in Spring Boot.
        for (int i = 0; i < excludes.size(); i++) {
            properties.put(EXCLUDE_PROPERTY + "[" + i + "]", excludes.get(i));
        }

        environment.getPropertySources().addFirst(
                new MapPropertySource("mongoAutoConfigExcludes", properties)
        );
    }

    private boolean isMongoExplicitlyEnabled(ConfigurableEnvironment environment) {
        String raw = environment.getProperty("MONGODB_ENABLED");
        if (raw == null || raw.isBlank()) {
            raw = environment.getProperty("app.mongodb.enabled");
        }
        return raw != null && "true".equals(raw.trim().toLowerCase(Locale.ROOT));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }
}
