package com.ssafy.oh_jjeom_oh.domain.board.dto.response;

import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

// GET /api/boards/{slug} 응답 (slug로 위시보드 조회)
@Getter
public class WishBoardPublicResponse {

    private final String boardSlug;
    private final String username;
    private final String nickname;
    private final String teamTag;
    private final LocalDate targetDate;
    private final List<WishItemResponse> items;
    private final List<BoardAssetResponse> assets;

    private WishBoardPublicResponse(String boardSlug, String username, String nickname, String teamTag,
                                     LocalDate targetDate, List<WishItemResponse> items, List<BoardAssetResponse> assets) {
        this.boardSlug = boardSlug;
        this.username = username;
        this.nickname = nickname;
        this.teamTag = teamTag;
        this.targetDate = targetDate;
        this.items = items;
        this.assets = assets;
    }

    public static WishBoardPublicResponse of(String boardSlug, String username, String nickname, String teamTag,
                                              LocalDate targetDate, List<WishItemResponse> items, List<BoardAssetResponse> assets) {
        return new WishBoardPublicResponse(boardSlug, username, nickname, teamTag, targetDate, items, assets);
    }
}
