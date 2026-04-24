package com.ssafy.oh_jjeom_oh.domain.asset.service;

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
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AssetService {

    private final AssetRepository assetRepository;

    // 파일명 → 화면 표시명 고정 매핑 (디자이너 확정본)
    private static final Map<String, String> WALLPAPER_DISPLAY_NAMES = Map.ofEntries(
            Map.entry("wallpaper-01.png", "별은하"),
            Map.entry("wallpaper-02.png", "보라우주"),
            Map.entry("wallpaper-03.png", "파란별"),
            Map.entry("wallpaper-04.png", "오로라"),
            Map.entry("wallpaper-05.png", "모눈종이"),
            Map.entry("wallpaper-06.png", "잔디꽃밭"),
            Map.entry("wallpaper-07.png", "공룡친구들"),
            Map.entry("wallpaper-08.png", "알록달록친구들"),
            Map.entry("wallpaper-09.png", "과일동산"),
            Map.entry("wallpaper-10.png", "마스킹테이프"),
            Map.entry("wallpaper-11.png", "달콤한하루"),
            Map.entry("wallpaper-12.png", "놀이공원"),
            Map.entry("wallpaper-13.png", "동화속숲"),
            Map.entry("wallpaper-14.png", "풍선파티"),
            Map.entry("wallpaper-15.png", "냥냥"),
            Map.entry("wallpaper-16.png", "토끼토끼")
    );

    public BackgroundListResponse getBackgrounds() {
        List<BackgroundItemResponse> items = assetRepository
                .findByAssetTypeOrderByDisplayOrderAsc(AssetType.BACKGROUND)
                .stream()
                .map(asset -> {
                    // assetKey에서 파일명만 추출 (예: "backgrounds/wallpaper-01.png" → "wallpaper-01.png")
                    String fileName = asset.getAssetKey().substring(asset.getAssetKey().lastIndexOf('/') + 1);
                    String displayName = WALLPAPER_DISPLAY_NAMES.getOrDefault(fileName, fileName);
                    return BackgroundItemResponse.of(asset, displayName);
                })
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
                .findByAssetTypeOrderByDisplayOrderAsc(AssetType.GIFT_ICON)
                .stream()
                .map(AssetItemResponse::of)
                .toList();
        return GiftIconListResponse.of(items);
    }
}
