package com.ssafy.oh_jjeom_oh.domain.board.dto.response;

import lombok.Getter;

@Getter
public class WishBoardCreateResponse {

    private final String boardSlug;

    private WishBoardCreateResponse(String boardSlug) {
        this.boardSlug = boardSlug;
    }

    public static WishBoardCreateResponse of(String boardSlug) {
        return new WishBoardCreateResponse(boardSlug);
    }
}
