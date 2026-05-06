package com.ssafy.oh_jjeom_oh.domain.board.entity;

import com.ssafy.oh_jjeom_oh.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "wish_boards")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class WishBoard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "board_slug", nullable = false, unique = true, length = 100)
    private String boardSlug;

    @Column(length = 100)
    private String title;

    @Column(name = "is_public", nullable = false)
    @Builder.Default
    private Boolean isPublic = true;

    @Column(name = "target_date")
    @Builder.Default
    private LocalDate targetDate = LocalDate.of(2026, 5, 5);

    @Column(name = "reveal_at")
    private LocalDateTime revealAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public void updateBoardSlug(String slug) {
        this.boardSlug = slug;
    }

    public void updateIsPublic(boolean isPublic) {
        this.isPublic = isPublic;
    }

    public void updateTitle(String title) {
        this.title = title;
    }

    public void updateRevealAt(LocalDateTime revealAt) {
        this.revealAt = revealAt;
    }
}
