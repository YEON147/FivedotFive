package com.ssafy.oh_jjeom_oh.domain.board.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "wish_items")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class WishItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private WishBoard board;

    @Column(name = "slot_index", nullable = false)
    private Integer slotIndex; // 1~3

    @Column(name = "item_name", length = 100)
    private String itemName; // null이면 빈 슬롯

    @Column(name = "like_count", nullable = false)
    @Builder.Default
    private Integer likeCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private WishItemStatus status = WishItemStatus.WANTED;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // 슬롯 수정 (like_count 초기화)
    public void update(String itemName) {
        this.itemName = itemName;
        this.likeCount = 0;
    }

    // 공감 +1
    public void incrementLikeCount() {
        this.likeCount++;
    }
}
