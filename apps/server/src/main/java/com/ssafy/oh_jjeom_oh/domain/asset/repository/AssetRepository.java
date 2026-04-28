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

    // 야구(baseball) 폴더를 제외한 일반 스티커 폴더 목록
    @Query(value = """
            SELECT DISTINCT SPLIT_PART(asset_key, '/', 2)
            FROM assets
            WHERE asset_type = 'STICKER'
              AND asset_key NOT LIKE 'stickers/baseball/%'
            ORDER BY SPLIT_PART(asset_key, '/', 2)
            """, nativeQuery = true)
    List<String> findGeneralStickerFolders();

    // 일반 폴더 + baseball 하위 서브폴더(baseball/{team}) 목록
    @Query(value = """
            SELECT DISTINCT SPLIT_PART(asset_key, '/', 2) AS folder
            FROM assets
            WHERE asset_type = 'STICKER'
              AND asset_key NOT LIKE 'stickers/baseball/%'
            UNION
            SELECT DISTINCT CONCAT('baseball/', SPLIT_PART(asset_key, '/', 3)) AS folder
            FROM assets
            WHERE asset_type = 'STICKER'
              AND asset_key LIKE 'stickers/baseball/%'
            ORDER BY folder
            """, nativeQuery = true)
    List<String> findStickerFoldersIncludingBaseball();

    @Query(value = """
            SELECT * FROM assets
            WHERE asset_type = 'STICKER'
            AND asset_key LIKE CONCAT('stickers/', :folder, '/%')
            ORDER BY display_order ASC
            """, nativeQuery = true)
    List<Asset> findStickersByFolder(@Param("folder") String folder);

    // 야구(baseball) 아이콘을 제외한 일반 선물 아이콘 목록
    @Query(value = """
            SELECT * FROM assets
            WHERE asset_type = 'GIFT_STICKER'
              AND asset_key NOT LIKE 'icons/baseball/%'
            ORDER BY display_order ASC
            """, nativeQuery = true)
    List<Asset> findGeneralGiftIcons();
}
