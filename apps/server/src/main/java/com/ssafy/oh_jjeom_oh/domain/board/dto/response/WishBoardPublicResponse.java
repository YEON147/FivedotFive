package com.ssafy.oh_jjeom_oh.domain.board.dto.response;

import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

// GET /api/boards/{slug} 응답 (slug로 위시보드 조회)
@Getter
public class WishBoardPublicResponse {

    private final String boardSlug;
    private final String username;
    private final LocalDate targetDate;
    private final List<WishItemResponse> items;
    private final List<BoardAssetResponse> assets;

    private WishBoardPublicResponse(String boardSlug, String username, LocalDate targetDate,
                                     List<WishItemResponse> items, List<BoardAssetResponse> assets) {
        this.boardSlug = boardSlug;
        this.username = username;
        this.targetDate = targetDate;
        this.items = items;
        this.assets = assets;
    }

    public static WishBoardPublicResponse of(WishBoard board,
                                              List<WishItemResponse> items,
                                              List<BoardAssetResponse> assets) {
        return new WishBoardPublicResponse(
                board.getBoardSlug(),
                board.getUser().getUsername(),
                board.getTargetDate(),
                items,
                assets
        );
    }
}
