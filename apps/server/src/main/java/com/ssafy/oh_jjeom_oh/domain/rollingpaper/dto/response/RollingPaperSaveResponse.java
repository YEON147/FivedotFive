package com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response;

import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class RollingPaperSaveResponse {

    private final String slug;
    private final String source;   // CREATED | RECEIVED
    private final LocalDateTime savedAt;

    private RollingPaperSaveResponse(String slug, String source, LocalDateTime savedAt) {
        this.slug = slug;
        this.source = source;
        this.savedAt = savedAt;
    }

    public static RollingPaperSaveResponse of(String slug, String source, LocalDateTime savedAt) {
        return new RollingPaperSaveResponse(slug, source, savedAt);
    }
}
