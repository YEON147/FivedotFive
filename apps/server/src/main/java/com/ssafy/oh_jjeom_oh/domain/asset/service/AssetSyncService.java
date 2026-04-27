package com.ssafy.oh_jjeom_oh.domain.asset.service;

import com.ssafy.oh_jjeom_oh.domain.asset.entity.Asset;
import com.ssafy.oh_jjeom_oh.domain.asset.entity.AssetType;
import com.ssafy.oh_jjeom_oh.domain.asset.repository.AssetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.paginators.ListObjectsV2Iterable;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssetSyncService {

    private static final String S3_PREFIX = "assets/";

    private final S3Client s3Client;
    private final AssetRepository assetRepository;

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    /**
     * assets 테이블을 전체 초기화한 뒤 S3 현재 상태 기준으로 재삽입합니다.
     * - 경로가 바뀐 파일, 삭제된 파일, 교체된 파일 모두 정리됩니다.
     * - board_assets는 assetKey TEXT로 저장되므로 영향 없습니다.
     */
    @Transactional
    public int resetAndSyncFromS3() {
        log.info("assets 테이블 전체 초기화 시작");
        assetRepository.deleteAll();
        assetRepository.flush();
        log.info("assets 테이블 초기화 완료, S3 재동기화 시작");
        return syncFromS3();
    }

    @Transactional
    public int syncFromS3() {
        // 1. S3에서 assets/ 하위 파일 목록 전체 조회 (페이지네이션 자동 처리)
        ListObjectsV2Iterable pages = s3Client.listObjectsV2Paginator(
                ListObjectsV2Request.builder()
                        .bucket(bucket)
                        .prefix(S3_PREFIX)
                        .build()
        );

        // "assets/" 제거 후 파일명 기준 정렬
        List<String> dbKeys = new ArrayList<>();
        pages.contents().forEach(obj -> {
            String key = obj.key();
            if (!key.endsWith("/")) {
                dbKeys.add(key.substring(S3_PREFIX.length()));
            }
        });
        dbKeys.sort(String::compareTo);

        log.info("S3에서 조회한 파일 수: {}", dbKeys.size());

        // 2. S3 키 목록 중 DB에 이미 존재하는 항목을 assetKey → Asset 맵으로 조회
        Map<String, Asset> existingAssetMap = assetRepository.findByAssetKeyIn(dbKeys).stream()
                .collect(Collectors.toMap(Asset::getAssetKey, a -> a));

        // 3. 신규 항목은 INSERT, 타입이 바뀐 항목은 UPDATE
        List<Asset> toInsert = new ArrayList<>();
        int updatedCount = 0;
        for (int i = 0; i < dbKeys.size(); i++) {
            String dbKey = dbKeys.get(i);
            AssetType type = resolveAssetType(dbKey);

            if (type == null) {
                log.warn("알 수 없는 에셋 경로, 건너뜀: {}", dbKey);
                continue;
            }

            Asset existing = existingAssetMap.get(dbKey);
            if (existing != null) {
                if (existing.getAssetType() != type) {
                    existing.updateAssetType(type);
                    updatedCount++;
                }
                continue;
            }

            toInsert.add(Asset.builder()
                    .assetType(type)
                    .assetKey(dbKey)
                    .displayOrder(i + 1)
                    .build());
        }

        assetRepository.saveAll(toInsert);
        log.info("새로 추가된 에셋 수: {}, 타입 수정된 에셋 수: {}", toInsert.size(), updatedCount);

        return toInsert.size();
    }

    /**
     * DB 저장 키(assets/ 제거 후)의 첫 번째 경로 세그먼트로 AssetType 결정
     * stickers/...   → STICKER
     * wallpapers/... → BACKGROUND
     * icons/...      → GIFT_STICKER
     */
    private AssetType resolveAssetType(String dbKey) {
        if (dbKey.startsWith("stickers/")) {
            return AssetType.STICKER;
        } else if (dbKey.startsWith("wallpapers/")) {
            return AssetType.BACKGROUND;
        } else if (dbKey.startsWith("icons/")) {
            return AssetType.GIFT_STICKER;
        }
        return null;
    }
}
