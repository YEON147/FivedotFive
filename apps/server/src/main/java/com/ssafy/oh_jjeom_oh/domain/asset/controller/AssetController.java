package com.ssafy.oh_jjeom_oh.domain.asset.controller;

import com.ssafy.oh_jjeom_oh.common.response.ApiResponse;
import com.ssafy.oh_jjeom_oh.common.response.SuccessMessage;
import com.ssafy.oh_jjeom_oh.domain.asset.dto.response.BackgroundListResponse;
import com.ssafy.oh_jjeom_oh.domain.asset.dto.response.GiftIconListResponse;
import com.ssafy.oh_jjeom_oh.domain.asset.dto.response.StickerCatalogListResponse;
import com.ssafy.oh_jjeom_oh.domain.asset.service.AssetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
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

    // GET /api/assets/gift-icons - 선물 아이콘 전체 조회 (Anyone)
    @GetMapping("/gift-icons")
    public ResponseEntity<ApiResponse<GiftIconListResponse>> getGiftIcons() {
        GiftIconListResponse data = assetService.getGiftIcons();
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.GIFT_ICON_LIST_FOUND, data));
    }
}
