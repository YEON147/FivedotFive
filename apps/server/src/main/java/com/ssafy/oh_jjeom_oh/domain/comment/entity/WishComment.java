package com.ssafy.oh_jjeom_oh.domain.comment.entity;

import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import com.ssafy.oh_jjeom_oh.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "wish_comments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class WishComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wish_list_id", nullable = false)
    private WishBoard wishBoard;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user; // null 가능 (비회원 댓글)

    @Column(name = "is_user", nullable = false)
    @Builder.Default
    private Boolean isUser = true;

    @Column(name = "sender_name", nullable = false, length = 8)
    private String senderName; // 작성 시점 닉네임 스냅샷

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "sticker_key", columnDefinition = "TEXT")
    private String stickerKey; // 댓글 스티커 CDN 키 (null 허용 - 스티커 없이 댓글 가능)

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public void updateContent(String content) {
        this.content = content;
    }

    public void updateStickerKey(String stickerKey) {
        this.stickerKey = stickerKey;
    }

    public void clearStickerKey() {
        this.stickerKey = null;
    }
}
