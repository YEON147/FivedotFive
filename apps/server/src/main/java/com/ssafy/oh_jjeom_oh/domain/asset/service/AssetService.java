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
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishBoardRepository;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AssetService {

    private final AssetRepository assetRepository;
    private final WishBoardRepository wishBoardRepository;

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

    /**
     * boardSlug가 없으면 야구 폴더를 제외한 일반 폴더만 반환합니다.
     * boardSlug가 구단 보드이면 일반 폴더 + baseball 하위 서브폴더 전체를 반환합니다.
     */
    public StickerFolderListResponse getStickerFolders(String boardSlug) {
        if (isBaseballBoard(boardSlug)) {
            return StickerFolderListResponse.of(assetRepository.findStickerFoldersIncludingBaseball());
        }
        return StickerFolderListResponse.of(assetRepository.findGeneralStickerFolders());
    }

    public StickerFolderResponse getStickersByFolder(String folder) {
        List<AssetItemResponse> items = assetRepository
                .findStickersByFolder(folder)
                .stream()
                .map(AssetItemResponse::of)
                .toList();
        return StickerFolderResponse.of(folder, items);
    }

    /**
     * boardSlug가 없으면 야구 아이콘을 제외한 일반 선물 아이콘만 반환합니다.
     * boardSlug가 구단 보드이면 모든 선물 아이콘을 반환합니다.
     */
    public GiftIconListResponse getGiftIcons(String boardSlug) {
        List<AssetItemResponse> items;
        if (isBaseballBoard(boardSlug)) {
            items = assetRepository
                    .findByAssetTypeOrderByDisplayOrderAsc(AssetType.GIFT_STICKER)
                    .stream()
                    .map(AssetItemResponse::of)
                    .toList();
        } else {
            items = assetRepository
                    .findGeneralGiftIcons()
                    .stream()
                    .map(AssetItemResponse::of)
                    .toList();
        }
        return GiftIconListResponse.of(items);
    }

    // boardSlug에 해당하는 보드의 소유자가 TEAM role인지 확인합니다.
    private boolean isBaseballBoard(String boardSlug) {
        if (boardSlug == null || boardSlug.isBlank()) return false;
        return wishBoardRepository.findByBoardSlug(boardSlug)
                .map(board -> board.getUser().getRole() == Role.TEAM)
                .orElse(false);
    }
}
