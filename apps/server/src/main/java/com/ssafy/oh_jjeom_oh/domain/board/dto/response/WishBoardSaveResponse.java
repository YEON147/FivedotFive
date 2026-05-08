package com.ssafy.oh_jjeom_oh.domain.board.dto.response;

import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class WishBoardSaveResponse {

    private final String slug;
    private final LocalDateTime savedAt;

    private WishBoardSaveResponse(String slug, LocalDateTime savedAt) {
        this.slug = slug;
        this.savedAt = savedAt;
    }

    public static WishBoardSaveResponse of(String slug, LocalDateTime savedAt) {
        return new WishBoardSaveResponse(slug, savedAt);
    }
}
