package com.ssafy.oh_jjeom_oh.domain.me.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.entity.RollingPaper;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** GET /api/me/boards-all 통합 목록 아이템 응답 */
@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BoardSummaryResponse {

    private final String type;          // "WISHBOARD" | "ROLLINGPAPER"
    private final String slug;
    private final String title;
    private final LocalDate targetDate;
    private final LocalDateTime createdAt;

    // WISHBOARD 전용
    private final Boolean isPublic;

    // ROLLINGPAPER 전용
    private final String recipientName;
    private final String imageKey;

    private BoardSummaryResponse(String type, String slug, String title, LocalDate targetDate,
                                  LocalDateTime createdAt, Boolean isPublic,
                                  String recipientName, String imageKey) {
        this.type = type;
        this.slug = slug;
        this.title = title;
        this.targetDate = targetDate;
        this.createdAt = createdAt;
        this.isPublic = isPublic;
        this.recipientName = recipientName;
        this.imageKey = imageKey;
    }

    public static BoardSummaryResponse fromWishBoard(WishBoard board) {
        return new BoardSummaryResponse(
                "WISHBOARD",
                board.getBoardSlug(),
                board.getTitle(),
                board.getTargetDate(),
                board.getCreatedAt(),
                board.getIsPublic(),
                null, null
        );
    }

    public static BoardSummaryResponse fromRollingPaper(RollingPaper paper) {
        return new BoardSummaryResponse(
                "ROLLINGPAPER",
                paper.getSlug(),
                paper.getTitle(),
                paper.getTargetDate(),
                paper.getCreatedAt(),
                null,
                paper.getRecipientName(),
                paper.getImageKey()
        );
    }
}
