package com.ssafy.oh_jjeom_oh.domain.board.dto.response;

import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

// GET /api/boards/me 응답 (내 위시보드 조회)
@Getter
public class WishBoardResponse {

    private final String boardSlug;
    private final Boolean isPublic;
    private final LocalDate targetDate;
    private final List<WishItemResponse> items;
    private final List<BoardAssetResponse> assets;

    private WishBoardResponse(String boardSlug, Boolean isPublic, LocalDate targetDate,
                               List<WishItemResponse> items, List<BoardAssetResponse> assets) {
        this.boardSlug = boardSlug;
        this.isPublic = isPublic;
        this.targetDate = targetDate;
        this.items = items;
        this.assets = assets;
    }

    public static WishBoardResponse of(WishBoard board,
                                        List<WishItemResponse> items,
                                        List<BoardAssetResponse> assets) {
        return new WishBoardResponse(
                board.getBoardSlug(),
                board.getIsPublic(),
                board.getTargetDate(),
                items,
                assets
        );
    }
}
