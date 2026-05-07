package com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.entity.RollingPaperComment;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class RollingPaperCommentResponse {

    private final Long id;
    private final String senderName;
    /**
     * targetDate 이전에는 본인 댓글({@code isUser=true})만 내용 공개.
     * targetDate 이후(revealed=true)에는 모든 댓글 공개.
     */
    private final String content;
    private final String stickerKey;
    @JsonProperty("isUser")
    private final boolean isUser;
    private final Integer slotIndex;
    private final LocalDateTime createdAt;

    private RollingPaperCommentResponse(Long id, String senderName, String content,
                                        String stickerKey, boolean isUser,
                                        Integer slotIndex, LocalDateTime createdAt) {
        this.id = id;
        this.senderName = senderName;
        this.content = content;
        this.stickerKey = stickerKey;
        this.isUser = isUser;
        this.slotIndex = slotIndex;
        this.createdAt = createdAt;
    }

    /** 로그인한 회원 조회 — 본인 댓글 여부 판별 */
    public static RollingPaperCommentResponse of(RollingPaperComment comment,
                                                  Long requestUserId, boolean revealed) {
        boolean isUser = comment.getUser() != null
                && comment.getUser().getId().equals(requestUserId);
        boolean visible = revealed || isUser;
        return new RollingPaperCommentResponse(
                comment.getId(),
                comment.getSenderName(),
                visible ? comment.getContent() : null,
                visible ? comment.getStickerKey() : null,
                isUser,
                comment.getSlotIndex(),
                comment.getCreatedAt()
        );
    }

    /** 비로그인 조회 — isUser 항상 false */
    public static RollingPaperCommentResponse ofAnonymous(RollingPaperComment comment,
                                                           boolean revealed) {
        return new RollingPaperCommentResponse(
                comment.getId(),
                comment.getSenderName(),
                revealed ? comment.getContent() : null,
                revealed ? comment.getStickerKey() : null,
                false,
                comment.getSlotIndex(),
                comment.getCreatedAt()
        );
    }
}
