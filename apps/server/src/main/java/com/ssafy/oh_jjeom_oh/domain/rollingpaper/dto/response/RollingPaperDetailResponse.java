package com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.entity.RollingPaper;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * GET /api/rolling-papers/{slug} 응답
 * - 소유자: isOwner=true, commentToken/viewToken 포함
 * - commentToken 접근자: canComment=true, commentToken/viewToken=null
 * - viewToken 접근자: canSave=true, commentToken/viewToken=null
 */
@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RollingPaperDetailResponse {

    private final String slug;
    private final String title;
    private final String recipientName;
    private final String imageKey;
    private final LocalDate targetDate;
    private final LocalDateTime createdAt;

    @JsonProperty("isOwner")
    private final boolean isOwner;
    private final boolean canComment;
    private final boolean canSave;
    @JsonProperty("isCommentPublic")
    private final boolean isCommentPublic;

    private final String commentToken;  // null if not owner
    private final String viewToken;     // null if not owner

    private RollingPaperDetailResponse(String slug, String title, String recipientName,
                                        String imageKey, LocalDate targetDate, LocalDateTime createdAt,
                                        boolean isOwner, boolean canComment, boolean canSave,
                                        boolean isCommentPublic,
                                        String commentToken, String viewToken) {
        this.slug = slug;
        this.title = title;
        this.recipientName = recipientName;
        this.imageKey = imageKey;
        this.targetDate = targetDate;
        this.createdAt = createdAt;
        this.isOwner = isOwner;
        this.canComment = canComment;
        this.canSave = canSave;
        this.isCommentPublic = isCommentPublic;
        this.commentToken = commentToken;
        this.viewToken = viewToken;
    }

    public static RollingPaperDetailResponse of(RollingPaper paper,
                                                 boolean isOwner,
                                                 boolean canComment,
                                                 boolean canSave) {
        return new RollingPaperDetailResponse(
                paper.getSlug(),
                paper.getTitle(),
                paper.getRecipientName(),
                paper.getImageKey(),
                paper.getTargetDate(),
                paper.getCreatedAt(),
                isOwner,
                canComment,
                canSave,
                paper.getIsCommentPublic(),
                isOwner ? paper.getCommentToken() : null,
                isOwner ? paper.getViewToken() : null
        );
    }
}
