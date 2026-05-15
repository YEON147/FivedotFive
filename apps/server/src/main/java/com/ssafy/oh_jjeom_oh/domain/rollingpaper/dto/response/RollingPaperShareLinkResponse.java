package com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response;

import lombok.Getter;

/** POST /api/rolling-papers/{slug}/share/comment|view 응답 */
@Getter
public class RollingPaperShareLinkResponse {

    private final String shortUrl;

    private RollingPaperShareLinkResponse(String shortUrl) {
        this.shortUrl = shortUrl;
    }

    public static RollingPaperShareLinkResponse of(String shortUrl) {
        return new RollingPaperShareLinkResponse(shortUrl);
    }
}
