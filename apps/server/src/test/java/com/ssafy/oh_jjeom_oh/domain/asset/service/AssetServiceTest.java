package com.ssafy.oh_jjeom_oh.domain.asset.service;

import com.ssafy.oh_jjeom_oh.domain.asset.dto.response.StickerCatalogListResponse;
import com.ssafy.oh_jjeom_oh.domain.asset.dto.response.StickerFolderListResponse;
import com.ssafy.oh_jjeom_oh.domain.asset.dto.response.StickerFolderResponse;
import com.ssafy.oh_jjeom_oh.domain.asset.entity.Asset;
import com.ssafy.oh_jjeom_oh.domain.asset.entity.AssetType;
import com.ssafy.oh_jjeom_oh.domain.asset.repository.AssetRepository;
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
    @DisplayName("스티커 폴더 목록 조회 성공 - 여러 폴더 존재")
    void getStickerFolders_success() {
        given(assetRepository.findDistinctStickerFolders())
                .willReturn(List.of("balloon", "bubble", "cute"));

        StickerFolderListResponse response = assetService.getStickerFolders();

        assertThat(response.getFolders()).hasSize(3);
        assertThat(response.getFolders()).containsExactly("balloon", "bubble", "cute");
    }

    @Test
    @DisplayName("boardSlug가 구단이 아니면 baseball·baseball/하위 폴더는 목록에서 제거")
    void getStickerFolders_nonTeam_removesBaseball() {
        given(assetRepository.findDistinctStickerFolders())
                .willReturn(List.of("balloon", "baseball", "baseball/giants", "cute"));

        StickerFolderListResponse response = assetService.getStickerFolders("myuser");

        assertThat(response.getFolders()).containsExactly("balloon", "cute");
    }

    @Test
    @DisplayName("boardSlug가 구단이면 야구 폴더를 앞에(루트 baseball → common → 팀 순), 일반 폴더는 뒤에")
    void getStickerFolders_team_includesBaseballSubfolders() {
        given(assetRepository.findDistinctStickerFolders())
                .willReturn(List.of(
                        "balloon",
                        "baseball/giants",
                        "baseball",
                        "baseball/common",
                        "cute"));

        StickerFolderListResponse response = assetService.getStickerFolders("lottegiants");

        assertThat(response.getFolders())
                .containsExactly("baseball", "baseball/common", "baseball/giants", "balloon", "cute");
    }

    @Test
    @DisplayName("폴더 API(boardSlug 없음과 동일)는 야구 관련 폴더 id를 내보내지 않음")
    void getStickerFolders_global_excludesBaseballPaths() {
        given(assetRepository.findDistinctStickerFolders())
                .willReturn(List.of("balloon", "baseball/common", "baseball/giants", "cute"));

        StickerFolderListResponse response = assetService.getStickerFolders();

        assertThat(response.getFolders()).containsExactly("balloon", "cute");
    }

    @Test
    @DisplayName("스티커 폴더 목록 조회 성공 - 폴더 없으면 빈 리스트 반환")
    void getStickerFolders_empty() {
        given(assetRepository.findDistinctStickerFolders()).willReturn(List.of());

        StickerFolderListResponse response = assetService.getStickerFolders();

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

    @Test
    @DisplayName("boardSlug 없으면 전체 스티커에서 baseball 경로 제외")
    void getStickers_noSlug_excludesBaseballPath() {
        given(assetRepository.findByAssetTypeOrderByDisplayOrderAsc(AssetType.STICKER)).willReturn(List.of(
                buildSticker(1L, "stickers/balloon/balloon-01.png", 1),
                buildSticker(2L, "stickers/baseball/giants/g-01.png", 2)
        ));

        StickerCatalogListResponse response = assetService.getStickers(null);

        assertThat(response.getStickers()).hasSize(1);
        assertThat(response.getStickers().get(0).getAssetKey()).isEqualTo("stickers/balloon/balloon-01.png");
    }

    @Test
    @DisplayName("비구단 boardSlug로 전체 스티커 조회 시 baseball 경로 제외")
    void getStickers_nonTeamBoard_excludesBaseballPath() {
        given(assetRepository.findByAssetTypeOrderByDisplayOrderAsc(AssetType.STICKER)).willReturn(List.of(
                buildSticker(1L, "stickers/balloon/balloon-01.png", 1),
                buildSticker(2L, "stickers/baseball/giants/g-01.png", 2)
        ));

        StickerCatalogListResponse response = assetService.getStickers("regular-user");

        assertThat(response.getStickers()).hasSize(1);
        assertThat(response.getStickers().get(0).getAssetKey()).isEqualTo("stickers/balloon/balloon-01.png");
    }

    @Test
    @DisplayName("비구단 boardSlug로 baseball 폴더 조회 시 빈 목록")
    void getStickersByFolder_baseball_nonTeam_returnsEmpty() {
        StickerFolderResponse response = assetService.getStickersByFolder("baseball", "regular-user");

        assertThat(response.getFolder()).isEqualTo("baseball");
        assertThat(response.getStickers()).isEmpty();
    }

    @Test
    @DisplayName("비구단 boardSlug로 baseball/giants 폴더 조회 시 빈 목록")
    void getStickersByFolder_baseballGiants_nonTeam_returnsEmpty() {
        StickerFolderResponse response = assetService.getStickersByFolder("baseball/giants", "regular-user");

        assertThat(response.getFolder()).isEqualTo("baseball/giants");
        assertThat(response.getStickers()).isEmpty();
    }

    @Test
    @DisplayName("폴더 id 앞에 /가 붙어도 정규화되어 야구 스티커 조회(LIKE 불일치 방지)")
    void getStickersByFolder_leadingSlash_baseballSubfolder_teamBoard_returnsStickers() {
        given(assetRepository.findStickersByFolder("baseball/landers")).willReturn(List.of(
                buildSticker(1L, "stickers/baseball/landers/s-01.png", 1)
        ));

        StickerFolderResponse response = assetService.getStickersByFolder("/baseball/landers", "lottegiants");

        assertThat(response.getFolder()).isEqualTo("baseball/landers");
        assertThat(response.getStickers()).hasSize(1);
        assertThat(response.getStickers().get(0).getAssetKey()).isEqualTo("stickers/baseball/landers/s-01.png");
    }

    @Test
    @DisplayName("normalizeStickerFolderId: 선행·후행 슬래시 및 연속 슬래시 제거")
    void normalizeStickerFolderId_trimsSlashes() {
        assertThat(AssetService.normalizeStickerFolderId("/baseball/landers")).isEqualTo("baseball/landers");
        assertThat(AssetService.normalizeStickerFolderId("baseball/landers/")).isEqualTo("baseball/landers");
        assertThat(AssetService.normalizeStickerFolderId("//baseball//landers//")).isEqualTo("baseball/landers");
    }
}
