package com.ssafy.oh_jjeom_oh.domain.board.dto.response;

import com.ssafy.oh_jjeom_oh.domain.comment.entity.WishComment;
import lombok.Getter;

@Getter
public class CommentStickerResponse {

    private final String stickerKey;

    private CommentStickerResponse(String stickerKey) {
        this.stickerKey = stickerKey;
    }

    public static CommentStickerResponse of(WishComment comment) {
        return new CommentStickerResponse(comment.getStickerKey());
    }
}
