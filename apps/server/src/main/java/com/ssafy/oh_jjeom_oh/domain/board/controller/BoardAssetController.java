package com.ssafy.oh_jjeom_oh.domain.board.controller;

import com.ssafy.oh_jjeom_oh.common.response.ApiResponse;
import com.ssafy.oh_jjeom_oh.common.response.SuccessMessage;
import com.ssafy.oh_jjeom_oh.common.security.UserPrincipal;
import com.ssafy.oh_jjeom_oh.domain.board.dto.request.BoardAssetUpdateRequest;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.BackgroundResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.StickerListResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.StickerResponse;
import com.ssafy.oh_jjeom_oh.domain.board.service.BoardAssetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/boards/{slug}/assets")
@RequiredArgsConstructor
public class BoardAssetController {

    private final BoardAssetService boardAssetService;

    // ===================== 배경 =====================

    // GET /api/boards/{slug}/assets/background
    @GetMapping("/background")
    public ResponseEntity<ApiResponse<BackgroundResponse>> getBackground(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String slug) {
        BackgroundResponse data = boardAssetService.getBackground(slug, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.BACKGROUND_FOUND, data));
    }

    // PUT /api/boards/{slug}/assets/background
    @PutMapping("/background")
    public ResponseEntity<ApiResponse<Void>> updateBackground(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String slug,
            @Valid @RequestBody BoardAssetUpdateRequest request) {
        boardAssetService.updateBackground(slug, principal.getId(), request.getAssetKey());
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.BACKGROUND_UPDATED));
    }

    // DELETE /api/boards/{slug}/assets/background
    @DeleteMapping("/background")
    public ResponseEntity<ApiResponse<Void>> deleteBackground(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String slug) {
        boardAssetService.deleteBackground(slug, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.BACKGROUND_DELETED));
    }

    // ===================== 스티커 =====================

    // GET /api/boards/{slug}/assets/stickers
    @GetMapping("/stickers")
    public ResponseEntity<ApiResponse<StickerListResponse>> getStickers(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String slug) {
        StickerListResponse data = boardAssetService.getStickers(slug, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.STICKER_FOUND, data));
    }

    // GET /api/boards/{slug}/assets/stickers/{slotIndex}
    @GetMapping("/stickers/{slotIndex}")
    public ResponseEntity<ApiResponse<StickerResponse>> getSticker(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String slug,
            @PathVariable int slotIndex) {
        StickerResponse data = boardAssetService.getSticker(slug, principal.getId(), slotIndex);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.STICKER_FOUND, data));
    }

    // PUT /api/boards/{slug}/assets/stickers/{slotIndex}
    @PutMapping("/stickers/{slotIndex}")
    public ResponseEntity<ApiResponse<Void>> updateSticker(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String slug,
            @PathVariable int slotIndex,
            @Valid @RequestBody BoardAssetUpdateRequest request) {
        boardAssetService.updateSticker(slug, principal.getId(), slotIndex, request.getAssetKey());
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.STICKER_UPDATED));
    }

    // DELETE /api/boards/{slug}/assets/stickers/{slotIndex}
    @DeleteMapping("/stickers/{slotIndex}")
    public ResponseEntity<ApiResponse<Void>> deleteSticker(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String slug,
            @PathVariable int slotIndex) {
        boardAssetService.deleteSticker(slug, principal.getId(), slotIndex);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.STICKER_DELETED));
    }
}
