package com.ssafy.oh_jjeom_oh.domain.asset.service;

import com.ssafy.oh_jjeom_oh.domain.asset.dto.response.StickerFolderListResponse;
import com.ssafy.oh_jjeom_oh.domain.asset.dto.response.StickerFolderResponse;
import com.ssafy.oh_jjeom_oh.domain.asset.entity.Asset;
import com.ssafy.oh_jjeom_oh.domain.asset.entity.AssetType;
import com.ssafy.oh_jjeom_oh.domain.asset.repository.AssetRepository;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishBoardRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class AssetServiceTest {

    @InjectMocks
    private AssetService assetService;

    @Mock
    private AssetRepository assetRepository;

    @Mock
    private WishBoardRepository wishBoardRepository;

    private Asset buildSticker(Long id, String assetKey, int order) {
        Asset asset = Asset.builder()
                .assetType(AssetType.STICKER)
                .assetKey(assetKey)
                .displayOrder(order)
                .build();
        ReflectionTestUtils.setField(asset, "id", id);
        return asset;
    }

    // ===================== getStickerFolders =====================

    @Test
    @DisplayName("스티커 폴더 목록 조회 성공 - boardSlug 없으면 일반 폴더만 반환")
    void getStickerFolders_success() {
        given(assetRepository.findGeneralStickerFolders())
                .willReturn(List.of("balloon", "bubble", "cute"));

        StickerFolderListResponse response = assetService.getStickerFolders(null);

        assertThat(response.getFolders()).hasSize(3);
        assertThat(response.getFolders()).containsExactly("balloon", "bubble", "cute");
    }

    @Test
    @DisplayName("스티커 폴더 목록 조회 성공 - 폴더 없으면 빈 리스트 반환")
    void getStickerFolders_empty() {
        given(assetRepository.findGeneralStickerFolders()).willReturn(List.of());

        StickerFolderListResponse response = assetService.getStickerFolders(null);

        assertThat(response.getFolders()).isEmpty();
    }

    // ===================== getStickersByFolder =====================

    @Test
    @DisplayName("폴더별 스티커 조회 성공 - 해당 폴더 스티커 반환")
    void getStickersByFolder_success() {
        given(assetRepository.findStickersByFolder("balloon")).willReturn(List.of(
                buildSticker(1L, "stickers/balloon/balloon-01.png", 1),
                buildSticker(2L, "stickers/balloon/balloon-02.png", 2)
        ));

        StickerFolderResponse response = assetService.getStickersByFolder("balloon");

        assertThat(response.getFolder()).isEqualTo("balloon");
        assertThat(response.getStickers()).hasSize(2);
        assertThat(response.getStickers().get(0).getAssetKey()).isEqualTo("stickers/balloon/balloon-01.png");
        assertThat(response.getStickers().get(1).getAssetKey()).isEqualTo("stickers/balloon/balloon-02.png");
    }

    @Test
    @DisplayName("폴더별 스티커 조회 성공 - 존재하지 않는 폴더면 빈 리스트 반환")
    void getStickersByFolder_notFound_returnsEmpty() {
        given(assetRepository.findStickersByFolder("nonexistent")).willReturn(List.of());

        StickerFolderResponse response = assetService.getStickersByFolder("nonexistent");

        assertThat(response.getFolder()).isEqualTo("nonexistent");
        assertThat(response.getStickers()).isEmpty();
    }

    @Test
    @DisplayName("폴더별 스티커 조회 성공 - displayOrder 순서대로 반환")
    void getStickersByFolder_orderedByDisplayOrder() {
        given(assetRepository.findStickersByFolder("cute")).willReturn(List.of(
                buildSticker(1L, "stickers/cute/cute-01.png", 1),
                buildSticker(2L, "stickers/cute/cute-02.png", 2),
                buildSticker(3L, "stickers/cute/cute-03.png", 3)
        ));

        StickerFolderResponse response = assetService.getStickersByFolder("cute");

        assertThat(response.getStickers()).hasSize(3);
        assertThat(response.getStickers().get(0).getId()).isEqualTo(1L);
        assertThat(response.getStickers().get(2).getId()).isEqualTo(3L);
    }
}
