package com.ssafy.oh_jjeom_oh.domain.board.dto.response;

import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** GET /api/boards/me/list 응답 — 목록 형식 (items/assets 미포함) */
@Getter
public class WishBoardResponse {

    private final String boardSlug;
    private final String title;
    private final Boolean isPublic;
    private final LocalDate targetDate;
    private final LocalDateTime createdAt;

    private WishBoardResponse(String boardSlug, String title, Boolean isPublic,
                               LocalDate targetDate, LocalDateTime createdAt) {
        this.boardSlug = boardSlug;
        this.title = title;
        this.isPublic = isPublic;
        this.targetDate = targetDate;
        this.createdAt = createdAt;
    }

    public static WishBoardResponse of(WishBoard board) {
        return new WishBoardResponse(
                board.getBoardSlug(),
                board.getTitle(),
                board.getIsPublic(),
                board.getTargetDate(),
                board.getCreatedAt()
        );
    }
}
