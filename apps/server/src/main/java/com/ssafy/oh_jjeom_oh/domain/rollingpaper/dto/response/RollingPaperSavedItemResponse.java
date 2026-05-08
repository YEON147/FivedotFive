package com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response;

import com.ssafy.oh_jjeom_oh.domain.rollingpaper.entity.RollingPaper;
import lombok.Getter;

import java.time.LocalDateTime;

/** GET /api/rolling-papers/me/saved 목록 아이템 */
@Getter
public class RollingPaperSavedItemResponse {

    private final String slug;
    private final String title;
    private final String source;   // CREATED | RECEIVED
    private final LocalDateTime savedAt;

    private RollingPaperSavedItemResponse(String slug, String title, String source, LocalDateTime savedAt) {
        this.slug = slug;
        this.title = title;
        this.source = source;
        this.savedAt = savedAt;
    }

    public static RollingPaperSavedItemResponse from(RollingPaper paper) {
        return new RollingPaperSavedItemResponse(
                paper.getSlug(),
                paper.getTitle(),
                paper.getSaveSource(),
                paper.getCreatedAt()
        );
    }
}
