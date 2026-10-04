package com.watchparty;

import com.watchparty.config.DotenvLoader;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class YoutubeWatchPartyApplication {

    private static final String MONGO_EXCLUDES = String.join(",",
            "org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration",
            "org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration",
            "org.springframework.boot.autoconfigure.data.mongo.MongoRepositoriesAutoConfiguration",
            "org.springframework.boot.actuate.autoconfigure.mongo.MongoHealthContributorAutoConfiguration"
    );

    public static void main(String[] args) {
        DotenvLoader.load();

        SpringApplication application = new SpringApplication(YoutubeWatchPartyApplication.class);
        if (!isMongoExplicitlyEnabled()) {
            Map<String, Object> defaults = new HashMap<>();
            defaults.put("spring.autoconfigure.exclude", MONGO_EXCLUDES);
            defaults.put("app.mongodb.enabled", "false");
            application.setDefaultProperties(defaults);
        }

        application.run(args);
    }

    private static boolean isMongoExplicitlyEnabled() {
        String fromProperty = System.getProperty("MONGODB_ENABLED");
        String fromEnv = System.getenv("MONGODB_ENABLED");
        String raw = fromProperty != null ? fromProperty : fromEnv;
        return raw != null && "true".equals(raw.trim().toLowerCase(Locale.ROOT));
    }
}
