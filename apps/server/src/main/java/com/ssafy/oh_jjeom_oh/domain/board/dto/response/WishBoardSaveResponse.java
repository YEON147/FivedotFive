package com.ssafy.oh_jjeom_oh.domain.board.dto.response;

import lombok.Getter;

@Getter
public class WishBoardSaveResponse {

    private final String boardSlug;

    private WishBoardSaveResponse(String boardSlug) {
        this.boardSlug = boardSlug;
    }

    public static WishBoardSaveResponse of(String boardSlug) {
        return new WishBoardSaveResponse(boardSlug);
    }
}
