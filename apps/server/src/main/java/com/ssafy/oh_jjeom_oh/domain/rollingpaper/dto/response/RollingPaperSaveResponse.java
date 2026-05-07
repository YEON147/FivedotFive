package com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response;

import lombok.Getter;

@Getter
public class RollingPaperSaveResponse {

    private final String paperSlug;

    private RollingPaperSaveResponse(String paperSlug) {
        this.paperSlug = paperSlug;
    }

    public static RollingPaperSaveResponse of(String paperSlug) {
        return new RollingPaperSaveResponse(paperSlug);
    }
}
