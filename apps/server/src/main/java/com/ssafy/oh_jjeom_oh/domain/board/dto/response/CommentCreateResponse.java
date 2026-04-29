package com.ssafy.oh_jjeom_oh.domain.board.dto.response;

import com.ssafy.oh_jjeom_oh.domain.comment.entity.WishComment;
import lombok.Getter;

@Getter
public class CommentCreateResponse {

    private final Long id;
    private final Integer slotIndex;

    private CommentCreateResponse(Long id, Integer slotIndex) {
        this.id = id;
        this.slotIndex = slotIndex;
    }

    public static CommentCreateResponse of(WishComment comment) {
        return new CommentCreateResponse(comment.getId(), comment.getSlotIndex());
    }
}
