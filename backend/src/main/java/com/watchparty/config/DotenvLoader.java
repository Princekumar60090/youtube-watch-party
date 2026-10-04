package com.watchparty.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

/**
 * Reads backend {@code .env} into system properties so Spring can use those values.
 * Does not override real OS environment variables. Secrets stay only in {@code .env}.
 */
public final class DotenvLoader {

    private static final List<Path> CANDIDATE_PATHS = List.of(
            Path.of(".env"),
            Path.of("backend/.env")
    );

    private DotenvLoader() {
    }

    public static void load() {
        Path envFile = CANDIDATE_PATHS.stream()
                .filter(Files::isRegularFile)
                .findFirst()
                .orElse(null);

        if (envFile == null) {
            return;
        }

        try {
            for (String rawLine : Files.readAllLines(envFile, StandardCharsets.UTF_8)) {
                String line = rawLine.trim();
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }
                if (line.startsWith("export ")) {
                    line = line.substring("export ".length()).trim();
                }

                int separator = line.indexOf('=');
                if (separator <= 0) {
                    continue;
                }

                String key = line.substring(0, separator).trim();
                String value = stripQuotes(line.substring(separator + 1).trim());

                if (key.isEmpty()) {
                    continue;
                }
                if (System.getenv(key) != null) {
                    continue;
                }
                if (System.getProperty(key) != null) {
                    continue;
                }

                System.setProperty(key, value);
            }
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to load .env from " + envFile.toAbsolutePath(), ex);
        }
    }

    private static String stripQuotes(String value) {
        if (value.length() >= 2) {
            char first = value.charAt(0);
            char last = value.charAt(value.length() - 1);
            if ((first == '"' && last == '"') || (first == '\'' && last == '\'')) {
                return value.substring(1, value.length() - 1);
            }
        }
        return value;
    }
}
