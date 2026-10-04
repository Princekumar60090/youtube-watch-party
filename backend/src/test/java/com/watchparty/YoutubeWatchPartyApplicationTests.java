package com.watchparty;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(properties = {
        "MONGODB_ENABLED=false",
        "app.mongodb.enabled=false",
        "spring.autoconfigure.exclude="
                + "org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration,"
                + "org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration,"
                + "org.springframework.boot.autoconfigure.data.mongo.MongoRepositoriesAutoConfiguration,"
                + "org.springframework.boot.actuate.autoconfigure.mongo.MongoHealthContributorAutoConfiguration"
})
@ActiveProfiles("dev")
class YoutubeWatchPartyApplicationTests {

    @Test
    void contextLoads() {
    }
}
