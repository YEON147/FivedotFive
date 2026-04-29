package com.ssafy.oh_jjeom_oh.domain.board.dto.response;

import lombok.Getter;

@Getter
public class WishItemLikeResponse {

    private final int likeCount;

    private WishItemLikeResponse(int likeCount) {
        this.likeCount = likeCount;
    }

    public static WishItemLikeResponse of(int likeCount) {
        return new WishItemLikeResponse(likeCount);
    }
}
