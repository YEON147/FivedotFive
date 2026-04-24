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
import java.util.Set;
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

    @Transactional
    public int syncFromS3() {
        // 1. S3에서 assets/ 하위 파일 목록 전체 조회 (페이지네이션 자동 처리)
        ListObjectsV2Iterable pages = s3Client.listObjectsV2Paginator(
                ListObjectsV2Request.builder()
                        .bucket(bucket)
                        .prefix(S3_PREFIX)
                        .build()
        );

        List<String> s3Keys = new ArrayList<>();
        pages.contents().forEach(obj -> {
            String key = obj.key();
            // 폴더 자체는 제외 (끝이 /인 항목)
            if (!key.endsWith("/")) {
                s3Keys.add(key);
            }
        });

        log.info("S3에서 조회한 파일 수: {}", s3Keys.size());

        // 2. DB에 이미 존재하는 assetKey 목록 조회
        Set<String> existingKeys = assetRepository.findAll().stream()
                .map(Asset::getAssetKey)
                .collect(Collectors.toSet());

        // 3. S3에는 있지만 DB에 없는 신규 항목만 필터링 후 저장
        List<Asset> toInsert = new ArrayList<>();
        for (int i = 0; i < s3Keys.size(); i++) {
            String s3Key = s3Keys.get(i);
            // "assets/" 접두사 제거 → DB 저장 키
            String dbKey = s3Key.substring(S3_PREFIX.length());

            if (existingKeys.contains(dbKey)) {
                continue;
            }

            AssetType type = resolveAssetType(dbKey);
            if (type == null) {
                log.warn("알 수 없는 에셋 경로, 건너뜀: {}", dbKey);
                continue;
            }

            toInsert.add(Asset.builder()
                    .assetType(type)
                    .assetKey(dbKey)
                    .displayOrder(i + 1)
                    .build());
        }

        assetRepository.saveAll(toInsert);
        log.info("새로 추가된 에셋 수: {}", toInsert.size());

        return toInsert.size();
    }

    /**
     * DB 저장 키(assets/ 제거 후)의 첫 번째 경로 세그먼트로 AssetType 결정
     * stickers/...   → STICKER
     * wallpapers/... → BACKGROUND
     * icons/...      → GIFT_ICON
     */
    private AssetType resolveAssetType(String dbKey) {
        if (dbKey.startsWith("stickers/")) {
            return AssetType.STICKER;
        } else if (dbKey.startsWith("wallpapers/")) {
            return AssetType.BACKGROUND;
        } else if (dbKey.startsWith("icons/")) {
            return AssetType.GIFT_ICON;
        }
        return null;
    }
}
