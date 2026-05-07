package com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response;

import com.ssafy.oh_jjeom_oh.domain.rollingpaper.entity.RollingPaper;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** GET /api/rolling-papers/me/list 목록 아이템 응답 (경량) */
@Getter
public class RollingPaperSummaryResponse {

    private final String slug;
    private final String title;
    private final String recipientName;
    private final String imageKey;
    private final LocalDate targetDate;
    private final LocalDateTime createdAt;

    private RollingPaperSummaryResponse(String slug, String title, String recipientName,
                                         String imageKey, LocalDate targetDate, LocalDateTime createdAt) {
        this.slug = slug;
        this.title = title;
        this.recipientName = recipientName;
        this.imageKey = imageKey;
        this.targetDate = targetDate;
        this.createdAt = createdAt;
    }

    public static RollingPaperSummaryResponse from(RollingPaper paper) {
        return new RollingPaperSummaryResponse(
                paper.getSlug(),
                paper.getTitle(),
                paper.getRecipientName(),
                paper.getImageKey(),
                paper.getTargetDate(),
                paper.getCreatedAt()
        );
    }
}
