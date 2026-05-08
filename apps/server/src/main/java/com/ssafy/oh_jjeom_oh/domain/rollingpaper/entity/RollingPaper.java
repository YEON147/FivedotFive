package com.ssafy.oh_jjeom_oh.domain.rollingpaper.entity;

import com.ssafy.oh_jjeom_oh.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "rolling_papers",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_rolling_papers_slug",          columnNames = "slug"),
        @UniqueConstraint(name = "uk_rolling_papers_comment_token", columnNames = "comment_token"),
        @UniqueConstraint(name = "uk_rolling_papers_view_token",    columnNames = "view_token")
    }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class RollingPaper {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;                                      // 생성자

    @Column(nullable = false, length = 100)
    private String slug;                                    // 공개 URL 슬러그

    @Column(nullable = false, length = 8)
    private String title;                                   // 롤링페이퍼 제목

    @Column(name = "recipient_name", length = 100)
    private String recipientName;                           // 받는 사람 이름 (선택)

    @Column(name = "image_key", columnDefinition = "TEXT")
    private String imageKey;                                // 받는 사람 이미지 CDN 키 (선택)

    @Column(name = "target_date", nullable = false)
    private LocalDate targetDate;                           // 댓글 공개 기준일

    @Column(name = "is_comment_public", nullable = false)
    @Builder.Default
    private Boolean isCommentPublic = false;                // true = targetDate 이전에도 댓글 즉시 공개

    @Column(name = "comment_token", length = 100)
    private String commentToken;                            // 댓글 작성용 공유 링크 토큰 (복사본은 NULL)

    @Column(name = "view_token", length = 100)
    private String viewToken;                               // 저장 전용 공유 링크 토큰 (복사본은 NULL)

    @Column(name = "is_saved_copy", nullable = false)
    @Builder.Default
    private Boolean isSavedCopy = false;                    // true = 저장된 독립 복사본

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "saved_by_user_id")
    private User savedByUser;                               // 복사본을 저장한 사용자 (원본이면 NULL)

    @Column(name = "save_source", length = 20)
    private String saveSource;                              // CREATED / RECEIVED / NULL(원본)

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;                        // 스케줄러 soft delete 일시 (NULL = 유효한 원본)

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public void updateTitle(String title) {
        this.title = title;
    }

    public void updateRecipientName(String recipientName) {
        this.recipientName = recipientName;
    }

    public void updateTargetDate(LocalDate targetDate) {
        this.targetDate = targetDate;
    }

    public void updateImageKey(String imageKey) {
        this.imageKey = imageKey;
    }

    public void updateIsCommentPublic(boolean isCommentPublic) {
        this.isCommentPublic = isCommentPublic;
    }

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }

    public boolean isDeleted() {
        return this.deletedAt != null;
    }
}
