package com.watchparty.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.watchparty.exception.BadRequestException;
import org.junit.jupiter.api.Test;

class YoutubeVideoIdParserTest {

    @Test
    void parsesRawVideoId() {
        assertEquals("dQw4w9WgXcQ", YoutubeVideoIdParser.parse("dQw4w9WgXcQ"));
    }

    @Test
    void parsesWatchUrl() {
        assertEquals(
                "dQw4w9WgXcQ",
                YoutubeVideoIdParser.parse("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
        );
    }

    @Test
    void rejectsInvalidInput() {
        assertThrows(BadRequestException.class, () -> YoutubeVideoIdParser.parse("bad-video-id!!"));
    }
}
