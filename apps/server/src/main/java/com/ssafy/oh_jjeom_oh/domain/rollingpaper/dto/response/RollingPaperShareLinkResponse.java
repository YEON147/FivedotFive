package com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response;

import lombok.Getter;

import java.time.LocalDateTime;

/** POST /api/rolling-papers/{slug}/share/comment|view 응답 */
@Getter
public class RollingPaperShareLinkResponse {

    private final String shortUrl;
    private final LocalDateTime expiresAt;

    private RollingPaperShareLinkResponse(String shortUrl, LocalDateTime expiresAt) {
        this.shortUrl = shortUrl;
        this.expiresAt = expiresAt;
    }

    public static RollingPaperShareLinkResponse of(String shortUrl, LocalDateTime expiresAt) {
        return new RollingPaperShareLinkResponse(shortUrl, expiresAt);
    }
}
