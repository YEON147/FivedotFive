package com.ssafy.oh_jjeom_oh.domain.board.dto.response;

import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

// GET /api/boards/{slug} 응답 (slug로 위시보드 조회)
@Getter
public class WishBoardPublicResponse {

    private final String boardSlug;
    private final String title;
    private final String username;
    private final String nickname;
    private final String teamTag;
    private final LocalDate targetDate;
    private final LocalDateTime createdAt;
    private final List<WishItemResponse> items;
    private final List<BoardAssetResponse> assets;

    private WishBoardPublicResponse(String boardSlug, String title, String username, String nickname, String teamTag,
                                     LocalDate targetDate, LocalDateTime createdAt,
                                     List<WishItemResponse> items, List<BoardAssetResponse> assets) {
        this.boardSlug = boardSlug;
        this.title = title;
        this.username = username;
        this.nickname = nickname;
        this.teamTag = teamTag;
        this.targetDate = targetDate;
        this.createdAt = createdAt;
        this.items = items;
        this.assets = assets;
    }

    public static WishBoardPublicResponse of(String boardSlug, String title, String username, String nickname,
                                              String teamTag, LocalDate targetDate, LocalDateTime createdAt,
                                              List<WishItemResponse> items, List<BoardAssetResponse> assets) {
        return new WishBoardPublicResponse(boardSlug, title, username, nickname, teamTag,
                targetDate, createdAt, items, assets);
    }
}
