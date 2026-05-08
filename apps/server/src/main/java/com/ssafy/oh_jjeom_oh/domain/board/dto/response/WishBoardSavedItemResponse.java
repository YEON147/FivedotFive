package com.ssafy.oh_jjeom_oh.domain.board.dto.response;

import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import lombok.Getter;

import java.time.LocalDateTime;

/** GET /api/boards/me/saved 목록 아이템 */
@Getter
public class WishBoardSavedItemResponse {

    private final String slug;
    private final String title;
    private final LocalDateTime savedAt;

    private WishBoardSavedItemResponse(String slug, String title, LocalDateTime savedAt) {
        this.slug = slug;
        this.title = title;
        this.savedAt = savedAt;
    }

    public static WishBoardSavedItemResponse from(WishBoard board) {
        return new WishBoardSavedItemResponse(
                board.getBoardSlug(),
                board.getTitle(),
                board.getCreatedAt()
        );
    }
}
