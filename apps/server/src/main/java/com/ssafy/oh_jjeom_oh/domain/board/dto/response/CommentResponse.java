package com.ssafy.oh_jjeom_oh.domain.board.dto.response;

import com.ssafy.oh_jjeom_oh.domain.comment.entity.WishComment;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class CommentResponse {

    private final Long id;
    private final String senderName;
    private final String content;
    private final String stickerKey;
    private final boolean isUser; // 요청자가 작성자인지 여부
    private final LocalDateTime createdAt;

    private CommentResponse(Long id, String senderName, String content,
                             String stickerKey, boolean isUser, LocalDateTime createdAt) {
        this.id = id;
        this.senderName = senderName;
        this.content = content;
        this.stickerKey = stickerKey;
        this.isUser = isUser;
        this.createdAt = createdAt;
    }

    /**
     * 로그인한 사용자가 조회할 때 - 본인 댓글 여부 계산
     */
    public static CommentResponse of(WishComment comment, Long requestUserId) {
        boolean isUser = comment.getUser() != null
                && comment.getUser().getId().equals(requestUserId);
        return new CommentResponse(
                comment.getId(),
                comment.getSenderName(),
                comment.getContent(),
                comment.getStickerKey(),
                isUser,
                comment.getCreatedAt()
        );
    }

    /**
     * 비로그인 사용자가 조회할 때 - isUser 항상 false
     */
    public static CommentResponse ofAnonymous(WishComment comment) {
        return new CommentResponse(
                comment.getId(),
                comment.getSenderName(),
                comment.getContent(),
                comment.getStickerKey(),
                false,
                comment.getCreatedAt()
        );
    }
}
