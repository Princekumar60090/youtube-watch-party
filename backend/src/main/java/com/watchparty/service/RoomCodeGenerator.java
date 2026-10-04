package com.watchparty.service;

import java.security.SecureRandom;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.mongodb.enabled", havingValue = "true")
public class RoomCodeGenerator {

    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int DEFAULT_LENGTH = 6;
    private final SecureRandom secureRandom = new SecureRandom();

    public String generate() {
        StringBuilder builder = new StringBuilder(DEFAULT_LENGTH);
        for (int i = 0; i < DEFAULT_LENGTH; i++) {
            int index = secureRandom.nextInt(ALPHABET.length());
            builder.append(ALPHABET.charAt(index));
        }
        return builder.toString();
    }
}
