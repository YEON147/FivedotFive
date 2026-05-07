package com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response;

import com.ssafy.oh_jjeom_oh.domain.rollingpaper.entity.RollingPaperComment;
import lombok.Getter;

@Getter
public class RollingPaperCommentCreateResponse {

    private final Long id;
    private final Integer slotIndex;

    private RollingPaperCommentCreateResponse(Long id, Integer slotIndex) {
        this.id = id;
        this.slotIndex = slotIndex;
    }

    public static RollingPaperCommentCreateResponse of(RollingPaperComment comment) {
        return new RollingPaperCommentCreateResponse(comment.getId(), comment.getSlotIndex());
    }
}
