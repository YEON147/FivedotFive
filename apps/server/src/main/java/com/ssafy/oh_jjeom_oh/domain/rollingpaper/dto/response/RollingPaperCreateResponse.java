package com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response;

import lombok.Getter;

@Getter
public class RollingPaperCreateResponse {

    private final String slug;
    private final String commentShareUrl;
    private final String viewShareUrl;

    private RollingPaperCreateResponse(String slug, String commentShareUrl, String viewShareUrl) {
        this.slug = slug;
        this.commentShareUrl = commentShareUrl;
        this.viewShareUrl = viewShareUrl;
    }

    public static RollingPaperCreateResponse of(String slug, String commentShareUrl, String viewShareUrl) {
        return new RollingPaperCreateResponse(slug, commentShareUrl, viewShareUrl);
    }
}
