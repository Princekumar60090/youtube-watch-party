package com.watchparty.util;

import com.watchparty.exception.BadRequestException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class YoutubeVideoIdParser {

    private static final Pattern RAW_ID = Pattern.compile("^[A-Za-z0-9_-]{11}$");
    private static final Pattern URL_PATTERNS = Pattern.compile(
            "(?:youtu\\.be/|youtube\\.com/(?:watch\\?v=|embed/|shorts/|live/))([A-Za-z0-9_-]{11})"
    );

    private YoutubeVideoIdParser() {
    }

    public static String parse(String rawInput) {
        if (rawInput == null || rawInput.isBlank()) {
            throw new BadRequestException("videoId is required");
        }

        String input = rawInput.trim();
        if (RAW_ID.matcher(input).matches()) {
            return input;
        }

        Matcher matcher = URL_PATTERNS.matcher(input);
        if (matcher.find()) {
            return matcher.group(1);
        }

        throw new BadRequestException("Invalid YouTube video id or URL");
    }
}
