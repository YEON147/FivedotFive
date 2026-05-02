package com.ssafy.oh_jjeom_oh.domain.board.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.ssafy.oh_jjeom_oh.domain.comment.entity.WishComment;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class CommentResponse {

    private final Long id;
    private final String senderName;
    /**
     * 댓글 내용 / 스티커 키.
     * 공개 시각(comment.reveal-at) 이전에는 본인 댓글({@code isUser=true})만 반환하고,
     * 타인 댓글은 {@code null}로 마스킹됩니다.
     * 공개 시각 이후에는 항상 실제 값을 반환합니다.
     */
    private final String content;
    private final String stickerKey;
    /** Jackson 기본명이 {@code user}로 떨어지는 것을 막고 프론트 {@code isUser}와 일치 */
    @JsonProperty("isUser")
    private final boolean isUser; // 요청자가 댓글 작성자인지 여부
    private final Integer slotIndex; // 보드 댓글 슬롯 위치 (0~5)
    private final LocalDateTime createdAt;

    private CommentResponse(Long id, String senderName, String content,
                             String stickerKey, boolean isUser, Integer slotIndex, LocalDateTime createdAt) {
        this.id = id;
        this.senderName = senderName;
        this.content = content;
        this.stickerKey = stickerKey;
        this.isUser = isUser;
        this.slotIndex = slotIndex;
        this.createdAt = createdAt;
    }

    /**
     * 로그인한 사용자가 조회할 때 - 본인 댓글 여부 계산
     *
     * @param revealed 공개 시각이 지났는지 여부 (true면 모든 댓글 내용 공개)
     */
    public static CommentResponse of(WishComment comment, Long requestUserId, boolean revealed) {
        boolean isUser = comment.getUser() != null
                && comment.getUser().getId().equals(requestUserId);
        boolean visible = revealed || isUser;
        String content    = visible ? comment.getContent()    : null;
        String stickerKey = visible ? comment.getStickerKey() : null;
        return new CommentResponse(
                comment.getId(),
                comment.getSenderName(),
                content,
                stickerKey,
                isUser,
                comment.getSlotIndex(),
                comment.getCreatedAt()
        );
    }

    /**
     * 비로그인 사용자가 조회할 때 - isUser 항상 false
     *
     * @param revealed 공개 시각이 지났는지 여부 (true면 모든 댓글 내용 공개)
     */
    public static CommentResponse ofAnonymous(WishComment comment, boolean revealed) {
        String content    = revealed ? comment.getContent()    : null;
        String stickerKey = revealed ? comment.getStickerKey() : null;
        return new CommentResponse(
                comment.getId(),
                comment.getSenderName(),
                content,
                stickerKey,
                false,
                comment.getSlotIndex(),
                comment.getCreatedAt()
        );
    }
}
