package com.ssafy.oh_jjeom_oh.domain.asset.repository;

import com.ssafy.oh_jjeom_oh.domain.asset.entity.Asset;
import com.ssafy.oh_jjeom_oh.domain.asset.entity.AssetType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AssetRepository extends JpaRepository<Asset, Long> {

    List<Asset> findByAssetTypeOrderByDisplayOrderAsc(AssetType assetType);

    List<Asset> findByAssetKeyIn(List<String> assetKeys);

    // stickers/{folder}/{file} 구조에서 folder명을 SPLIT_PART로 추출 (PostgreSQL 전용)
    @Query(value = """
            SELECT DISTINCT SPLIT_PART(asset_key, '/', 2)
            FROM assets
            WHERE asset_type = 'STICKER'
            ORDER BY SPLIT_PART(asset_key, '/', 2)
            """, nativeQuery = true)
    List<String> findDistinctStickerFolders();

    @Query(value = """
            SELECT * FROM assets
            WHERE asset_type = 'STICKER'
            AND asset_key LIKE CONCAT('stickers/', :folder, '/%')
            ORDER BY display_order ASC
            """, nativeQuery = true)
    List<Asset> findStickersByFolder(@Param("folder") String folder);
}
