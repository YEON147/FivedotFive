package com.ssafy.oh_jjeom_oh.domain.asset.service;

import com.ssafy.oh_jjeom_oh.domain.asset.constant.TeamBoardSlug;
import com.ssafy.oh_jjeom_oh.domain.asset.constant.WallpaperDisplayNames;
import com.ssafy.oh_jjeom_oh.domain.asset.dto.response.AssetItemResponse;
import com.ssafy.oh_jjeom_oh.domain.asset.dto.response.BackgroundItemResponse;
import com.ssafy.oh_jjeom_oh.domain.asset.dto.response.BackgroundListResponse;
import com.ssafy.oh_jjeom_oh.domain.asset.dto.response.GiftIconListResponse;
import com.ssafy.oh_jjeom_oh.domain.asset.dto.response.StickerCatalogListResponse;
import com.ssafy.oh_jjeom_oh.domain.asset.dto.response.StickerFolderListResponse;
import com.ssafy.oh_jjeom_oh.domain.asset.dto.response.StickerFolderResponse;
import com.ssafy.oh_jjeom_oh.domain.asset.entity.AssetType;
import com.ssafy.oh_jjeom_oh.domain.asset.repository.AssetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AssetService {

    private final AssetRepository assetRepository;

    public BackgroundListResponse getBackgrounds() {
        List<BackgroundItemResponse> items = assetRepository
                .findByAssetTypeOrderByDisplayOrderAsc(AssetType.BACKGROUND)
                .stream()
                .map(asset -> BackgroundItemResponse.of(asset, WallpaperDisplayNames.resolve(asset.getAssetKey())))
                .toList();
        return BackgroundListResponse.of(items);
    }

    public StickerCatalogListResponse getStickers() {
        return getStickers(null);
    }

    /**
     * @param boardSlug 구단 보드가 아니면 {@code stickers/baseball/} 경로 스티커는 제외합니다.
     *                  {@code null}·공백이면 야구 필터 없음(기존 전체 카탈로그와 동일).
     */
    public StickerCatalogListResponse getStickers(String boardSlug) {
        List<AssetItemResponse> items = assetRepository
                .findByAssetTypeOrderByDisplayOrderAsc(AssetType.STICKER)
                .stream()
                .filter(asset -> includeStickerForBoardContext(asset.getAssetKey(), boardSlug))
                .map(AssetItemResponse::of)
                .toList();
        return StickerCatalogListResponse.of(items);
    }

    public StickerFolderListResponse getStickerFolders() {
        List<String> folders = assetRepository.findDistinctStickerFolders();
        return StickerFolderListResponse.of(folders);
    }

    /**
     * 구단 보드(boardSlug)면 야구 스티커 폴더(<code>baseball</code>)를 목록에 포함합니다.
     *
     * @param boardSlug 없거나 비어 있으면 {@link #getStickerFolders()} 와 동일
     */
    public StickerFolderListResponse getStickerFolders(String boardSlug) {
        if (boardSlug == null || boardSlug.isBlank()) {
            return getStickerFolders();
        }
        List<String> folders = new ArrayList<>(assetRepository.findDistinctStickerFolders());
        if (TeamBoardSlug.isTeamBoard(boardSlug)) {
            if (!folders.contains("baseball")) {
                folders.add("baseball");
            }
            folders.sort(Comparator.naturalOrder());
        } else {
            folders.removeIf(f -> "baseball".equalsIgnoreCase(f));
        }
        return StickerFolderListResponse.of(folders);
    }

    public StickerFolderResponse getStickersByFolder(String folder) {
        return getStickersByFolder(folder, null);
    }

    /**
     * @param boardSlug 구단 보드가 아니면 {@code folder} 가 {@code baseball} 일 때 빈 목록을 반환합니다.
     */
    public StickerFolderResponse getStickersByFolder(String folder, String boardSlug) {
        if (folder != null
                && "baseball".equalsIgnoreCase(folder.trim())
                && boardSlug != null
                && !boardSlug.isBlank()
                && !TeamBoardSlug.isTeamBoard(boardSlug)) {
            return StickerFolderResponse.of(folder, List.of());
        }
        List<AssetItemResponse> items = assetRepository
                .findStickersByFolder(folder)
                .stream()
                .map(AssetItemResponse::of)
                .toList();
        return StickerFolderResponse.of(folder, items);
    }

    public GiftIconListResponse getGiftIcons() {
        List<AssetItemResponse> items = assetRepository
                .findByAssetTypeOrderByDisplayOrderAsc(AssetType.GIFT_STICKER)
                .stream()
                .map(AssetItemResponse::of)
                .toList();
        return GiftIconListResponse.of(items);
    }

    /**
     * 구단 보드가 아니면 asset_key 에 {@code baseball} 이 포함된 선물 아이콘은 제외합니다.
     *
     * @param boardSlug 없거나 비어 있으면 {@link #getGiftIcons()} 와 동일
     */
    public GiftIconListResponse getGiftIcons(String boardSlug) {
        if (boardSlug == null || boardSlug.isBlank()) {
            return getGiftIcons();
        }
        List<AssetItemResponse> items = assetRepository
                .findByAssetTypeOrderByDisplayOrderAsc(AssetType.GIFT_STICKER)
                .stream()
                .filter(asset -> TeamBoardSlug.isTeamBoard(boardSlug)
                        || !asset.getAssetKey().toLowerCase().contains("baseball"))
                .map(AssetItemResponse::of)
                .toList();
        return GiftIconListResponse.of(items);
    }

    private static boolean includeStickerForBoardContext(String assetKey, String boardSlug) {
        if (boardSlug == null || boardSlug.isBlank()) {
            return true;
        }
        if (TeamBoardSlug.isTeamBoard(boardSlug)) {
            return true;
        }
        return !isBaseballStickerPath(assetKey);
    }

    private static boolean isBaseballStickerPath(String assetKey) {
        if (assetKey == null || assetKey.isBlank()) {
            return false;
        }
        return assetKey.toLowerCase().startsWith("stickers/baseball/");
    }
}
