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

    /**
     * 일반: {@code stickers/{폴더}/…} → 첫 경로 세그먼트(balloon 등).
     * 야구: {@code stickers/baseball/{팀}/…} → 폴더 id {@code baseball/{팀}}.
     */
    @Query(value = """
            SELECT DISTINCT CASE
                WHEN LOWER(asset_key) LIKE 'stickers/baseball/%' THEN
                    CONCAT(
                        SPLIT_PART(asset_key, '/', 2),
                        '/',
                        SPLIT_PART(asset_key, '/', 3)
                    )
                ELSE SPLIT_PART(asset_key, '/', 2)
            END
            FROM assets
            WHERE asset_type = 'STICKER'
            ORDER BY 1
            """, nativeQuery = true)
    List<String> findDistinctStickerFolders();

    /** {@code folder} 예: {@code balloon}, {@code baseball/giants} — 슬래시 포함 */
    @Query(value = """
            SELECT * FROM assets
            WHERE asset_type = 'STICKER'
            AND asset_key LIKE CONCAT('stickers/', :folder, '/%')
            ORDER BY display_order ASC
            """, nativeQuery = true)
    List<Asset> findStickersByFolder(@Param("folder") String folder);
}
