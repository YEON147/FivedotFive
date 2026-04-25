package com.ssafy.oh_jjeom_oh.domain.asset.entity;

import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "board_assets")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class BoardAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "board_id", nullable = false)
    private WishBoard board;

    @Enumerated(EnumType.STRING)
    @Column(name = "asset_type", nullable = false, length = 20)
    private AssetType assetType; // BACKGROUND / STICKER / GIFT_STICKER

    @Column(name = "asset_key", nullable = false, columnDefinition = "TEXT")
    private String assetKey; // S3 CDN 리소스 키

    @Column(name = "slot_index")
    private Integer slotIndex; // STICKER: 1~6 / GIFT_STICKER: 1~3 / BACKGROUND: null

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public void updateAssetKey(String assetKey) {
        this.assetKey = assetKey;
    }
}
