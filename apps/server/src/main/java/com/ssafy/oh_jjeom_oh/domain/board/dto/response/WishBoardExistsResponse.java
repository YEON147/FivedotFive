package com.ssafy.oh_jjeom_oh.domain.board.dto.response;

import lombok.Getter;

@Getter
public class WishBoardExistsResponse {

    private final boolean exists;

    private WishBoardExistsResponse(boolean exists) {
        this.exists = exists;
    }

    public static WishBoardExistsResponse of(boolean exists) {
        return new WishBoardExistsResponse(exists);
    }
}
