package com.ssafy.oh_jjeom_oh.domain.asset.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "assets")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Asset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "asset_type", nullable = false, length = 30)
    private AssetType assetType; // BACKGROUND / STICKER / GIFT_STICKER / ROLLING_PAPER_PROFILE

    @Column(name = "asset_key", nullable = false, columnDefinition = "TEXT")
    private String assetKey; // S3 CDN 리소스 키

    @Column(name = "display_order")
    private Integer displayOrder;

    public void updateAssetType(AssetType assetType) {
        this.assetType = assetType;
    }
}
