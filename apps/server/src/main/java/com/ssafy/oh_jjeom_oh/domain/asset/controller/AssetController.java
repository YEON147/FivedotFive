package com.ssafy.oh_jjeom_oh.domain.asset.controller;

import com.ssafy.oh_jjeom_oh.common.response.ApiResponse;
import com.ssafy.oh_jjeom_oh.common.response.SuccessMessage;
import com.ssafy.oh_jjeom_oh.domain.asset.dto.response.BackgroundListResponse;
import com.ssafy.oh_jjeom_oh.domain.asset.dto.response.GiftIconListResponse;
import com.ssafy.oh_jjeom_oh.domain.asset.dto.response.StickerCatalogListResponse;
import com.ssafy.oh_jjeom_oh.domain.asset.dto.response.StickerFolderListResponse;
import com.ssafy.oh_jjeom_oh.domain.asset.dto.response.StickerFolderResponse;
import com.ssafy.oh_jjeom_oh.domain.asset.service.AssetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assets")
@RequiredArgsConstructor
public class AssetController {

    private final AssetService assetService;

    // GET /api/assets/backgrounds - 배경 전체 조회 (Anyone)
    @GetMapping("/backgrounds")
    public ResponseEntity<ApiResponse<BackgroundListResponse>> getBackgrounds() {
        BackgroundListResponse data = assetService.getBackgrounds();
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.BACKGROUND_LIST_FOUND, data));
    }

    // GET /api/assets/stickers - 스티커 전체 조회 (Anyone)
    @GetMapping("/stickers")
    public ResponseEntity<ApiResponse<StickerCatalogListResponse>> getStickers() {
        StickerCatalogListResponse data = assetService.getStickers();
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.STICKER_LIST_FOUND, data));
    }

    // GET /api/assets/stickers/folders?boardSlug={slug} - 스티커 폴더 목록 조회 (Anyone)
    // boardSlug가 구단 보드이면 야구 폴더도 포함하여 반환합니다.
    @GetMapping("/stickers/folders")
    public ResponseEntity<ApiResponse<StickerFolderListResponse>> getStickerFolders(
            @RequestParam(required = false) String boardSlug) {
        StickerFolderListResponse data = assetService.getStickerFolders(boardSlug);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.STICKER_FOLDER_LIST_FOUND, data));
    }

    // GET /api/assets/stickers/folders/{folder} - 특정 폴더의 스티커 조회 (Anyone)
    @GetMapping("/stickers/folders/{folder}")
    public ResponseEntity<ApiResponse<StickerFolderResponse>> getStickersByFolder(
            @PathVariable String folder) {
        StickerFolderResponse data = assetService.getStickersByFolder(folder);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.STICKER_FOLDER_FOUND, data));
    }

    // GET /api/assets/gift-icons?boardSlug={slug} - 선물 아이콘 조회 (Anyone)
    // boardSlug가 구단 보드이면 야구 아이콘도 포함하여 반환합니다.
    @GetMapping("/gift-icons")
    public ResponseEntity<ApiResponse<GiftIconListResponse>> getGiftIcons(
            @RequestParam(required = false) String boardSlug) {
        GiftIconListResponse data = assetService.getGiftIcons(boardSlug);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.GIFT_ICON_LIST_FOUND, data));
    }
}
