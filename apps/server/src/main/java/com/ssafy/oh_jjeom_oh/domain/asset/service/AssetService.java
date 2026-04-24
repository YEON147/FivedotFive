package com.ssafy.oh_jjeom_oh.domain.asset.service;

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
        List<AssetItemResponse> items = assetRepository
                .findByAssetTypeOrderByDisplayOrderAsc(AssetType.STICKER)
                .stream()
                .map(AssetItemResponse::of)
                .toList();
        return StickerCatalogListResponse.of(items);
    }

    public StickerFolderListResponse getStickerFolders() {
        List<String> folders = assetRepository.findDistinctStickerFolders();
        return StickerFolderListResponse.of(folders);
    }

    public StickerFolderResponse getStickersByFolder(String folder) {
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
}
