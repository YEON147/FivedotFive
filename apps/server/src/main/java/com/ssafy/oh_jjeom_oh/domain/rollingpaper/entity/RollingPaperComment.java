package com.ssafy.oh_jjeom_oh.domain.rollingpaper.entity;

import com.ssafy.oh_jjeom_oh.common.constant.CommentConstants;
import com.ssafy.oh_jjeom_oh.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "rolling_paper_comments",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_rp_comments_paper_slot",
        columnNames = {"rolling_paper_id", "slot_index"}
    )
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class RollingPaperComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rolling_paper_id", nullable = false)
    private RollingPaper rollingPaper;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;                                      // null 가능 (비회원 댓글)

    @Column(name = "is_user", nullable = false)
    @Builder.Default
    private Boolean isUser = true;

    @Column(name = "sender_name", nullable = false, length = 8)
    private String senderName;                              // 작성 시점 닉네임 스냅샷

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "sticker_key", columnDefinition = "TEXT")
    private String stickerKey;                              // 댓글 스티커 CDN 키 (선택)

    @Column(name = "slot_index")
    private Integer slotIndex;                              // 댓글 슬롯 위치 (선택)

    @Column(name = "guest_password", length = 255)
    private String guestPassword;                           // 비회원 댓글 수정·삭제용 비밀번호 (null = 로그인 댓글)

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public void softDelete() {
        this.senderName = CommentConstants.DELETED_SENDER_NAME;
        this.content = CommentConstants.DELETED_CONTENT;
        this.user = null;
        this.isUser = false;
        this.guestPassword = null;
    }

    public void updateContent(String content) {
        this.content = content;
    }
}
