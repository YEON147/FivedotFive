package com.ssafy.oh_jjeom_oh.domain.asset.service;

import com.ssafy.oh_jjeom_oh.domain.asset.entity.Asset;
import com.ssafy.oh_jjeom_oh.domain.asset.entity.AssetType;
import com.ssafy.oh_jjeom_oh.domain.asset.repository.AssetRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.S3Object;
import software.amazon.awssdk.services.s3.paginators.ListObjectsV2Iterable;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssetSyncServiceTest {

    @InjectMocks
    private AssetSyncService assetSyncService;

    @Mock private S3Client s3Client;
    @Mock private AssetRepository assetRepository;
    @Mock private ListObjectsV2Iterable listIterable;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(assetSyncService, "bucket", "five-dot-five");
    }

    // ===================== syncFromS3 =====================

    @Test
    @DisplayName("sync - S3 신규 파일이 DB에 추가됨")
    void syncFromS3_insertsNewAssets() {
        given(s3Client.listObjectsV2Paginator(any(ListObjectsV2Request.class))).willReturn(listIterable);
        given(listIterable.contents()).willReturn(List.of(
                s3Object("assets/wallpapers/wallpaper-01.png"),
                s3Object("assets/stickers/balloon/balloon-01.png"),
                s3Object("assets/icons/food/food-001.png")
        ).stream()::iterator);
        given(assetRepository.findByAssetKeyIn(any())).willReturn(List.of());
        given(assetRepository.saveAll(any())).willAnswer(inv -> inv.getArgument(0));

        int added = assetSyncService.syncFromS3();

        assertThat(added).isEqualTo(3);
        verify(assetRepository).saveAll(argThat(assets -> {
            List<Asset> list = (List<Asset>) assets;
            return list.stream().anyMatch(a -> a.getAssetType() == AssetType.BACKGROUND)
                    && list.stream().anyMatch(a -> a.getAssetType() == AssetType.STICKER)
                    && list.stream().anyMatch(a -> a.getAssetType() == AssetType.GIFT_STICKER);
        }));
    }

    @Test
    @DisplayName("sync - DB에 이미 존재하는 키는 INSERT 건너뜀")
    void syncFromS3_skipsExistingKeys() {
        given(s3Client.listObjectsV2Paginator(any(ListObjectsV2Request.class))).willReturn(listIterable);
        given(listIterable.contents()).willReturn(List.of(
                s3Object("assets/wallpapers/wallpaper-01.png")
        ).stream()::iterator);

        Asset existing = Asset.builder()
                .assetType(AssetType.BACKGROUND)
                .assetKey("wallpapers/wallpaper-01.png")
                .displayOrder(1)
                .build();
        given(assetRepository.findByAssetKeyIn(any())).willReturn(List.of(existing));
        given(assetRepository.saveAll(any())).willAnswer(inv -> inv.getArgument(0));

        int added = assetSyncService.syncFromS3();

        assertThat(added).isEqualTo(0);
    }

    @Test
    @DisplayName("sync - 알 수 없는 경로는 건너뜀")
    void syncFromS3_skipsUnknownPrefix() {
        given(s3Client.listObjectsV2Paginator(any(ListObjectsV2Request.class))).willReturn(listIterable);
        given(listIterable.contents()).willReturn(List.of(
                s3Object("assets/unknown/something.png")
        ).stream()::iterator);
        given(assetRepository.findByAssetKeyIn(any())).willReturn(List.of());
        given(assetRepository.saveAll(any())).willAnswer(inv -> inv.getArgument(0));

        int added = assetSyncService.syncFromS3();

        assertThat(added).isEqualTo(0);
    }

    @Test
    @DisplayName("sync - 폴더 경로(/ 로 끝나는 항목)는 무시됨")
    void syncFromS3_ignoresDirectoryKeys() {
        given(s3Client.listObjectsV2Paginator(any(ListObjectsV2Request.class))).willReturn(listIterable);
        given(listIterable.contents()).willReturn(List.of(
                s3Object("assets/wallpapers/"),
                s3Object("assets/wallpapers/wallpaper-01.png")
        ).stream()::iterator);
        given(assetRepository.findByAssetKeyIn(any())).willReturn(List.of());
        given(assetRepository.saveAll(any())).willAnswer(inv -> inv.getArgument(0));

        int added = assetSyncService.syncFromS3();

        assertThat(added).isEqualTo(1);
    }

    // ===================== resetAndSyncFromS3 =====================

    @Test
    @DisplayName("reset-sync - deleteAll 후 S3 기준으로 전체 재삽입")
    void resetAndSyncFromS3_deletesAllThenResyncs() {
        given(s3Client.listObjectsV2Paginator(any(ListObjectsV2Request.class))).willReturn(listIterable);
        given(listIterable.contents()).willReturn(List.of(
                s3Object("assets/wallpapers/wallpaper-01.png"),
                s3Object("assets/wallpapers/wallpaper-02.png")
        ).stream()::iterator);
        given(assetRepository.findByAssetKeyIn(any())).willReturn(List.of());
        given(assetRepository.saveAll(any())).willAnswer(inv -> inv.getArgument(0));

        int added = assetSyncService.resetAndSyncFromS3();

        // deleteAll이 반드시 먼저 호출됨을 순서대로 검증
        var inOrder = inOrder(assetRepository);
        inOrder.verify(assetRepository).deleteAll();
        inOrder.verify(assetRepository).flush();
        inOrder.verify(assetRepository).saveAll(any());

        assertThat(added).isEqualTo(2);
    }

    @Test
    @DisplayName("reset-sync - 구 경로 데이터가 남아있어도 deleteAll로 완전 초기화 후 재삽입")
    void resetAndSyncFromS3_clearsOldPathsBeforeSync() {
        given(s3Client.listObjectsV2Paginator(any(ListObjectsV2Request.class))).willReturn(listIterable);
        given(listIterable.contents()).willReturn(List.of(
                s3Object("assets/icons/food/food-001.png") // 새 경로
        ).stream()::iterator);
        given(assetRepository.findByAssetKeyIn(any())).willReturn(List.of());
        given(assetRepository.saveAll(any())).willAnswer(inv -> inv.getArgument(0));

        assetSyncService.resetAndSyncFromS3();

        verify(assetRepository).deleteAll();
        verify(assetRepository).saveAll(argThat(assets -> {
            List<Asset> list = (List<Asset>) assets;
            return list.size() == 1
                    && list.get(0).getAssetKey().equals("icons/food/food-001.png")
                    && list.get(0).getAssetType() == AssetType.GIFT_STICKER;
        }));
    }

    // ===== helper =====

    private S3Object s3Object(String key) {
        return S3Object.builder().key(key).build();
    }
}
