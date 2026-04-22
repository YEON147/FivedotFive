package com.ssafy.oh_jjeom_oh.domain.board.controller;

import com.ssafy.oh_jjeom_oh.common.response.ApiResponse;
import com.ssafy.oh_jjeom_oh.common.response.SuccessMessage;
import com.ssafy.oh_jjeom_oh.common.security.CurrentUser;
import com.ssafy.oh_jjeom_oh.common.security.UserPrincipal;
import com.ssafy.oh_jjeom_oh.domain.board.dto.request.BoardAssetUpdateRequest;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.BackgroundResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.StickerListResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.StickerResponse;
import com.ssafy.oh_jjeom_oh.domain.board.service.BoardAssetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/boards/me/assets")
@RequiredArgsConstructor
public class BoardAssetController {

    private final BoardAssetService boardAssetService;

    // ===================== 배경 =====================

    // GET /api/boards/me/assets/background
    @GetMapping("/background")
    public ResponseEntity<ApiResponse<BackgroundResponse>> getBackground(
            @CurrentUser UserPrincipal principal) {
        BackgroundResponse data = boardAssetService.getBackground(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.BACKGROUND_FOUND, data));
    }

    // PUT /api/boards/me/assets/background
    @PutMapping("/background")
    public ResponseEntity<ApiResponse<Void>> updateBackground(
            @CurrentUser UserPrincipal principal,
            @Valid @RequestBody BoardAssetUpdateRequest request) {
        boardAssetService.updateBackground(principal.getId(), request.getAssetKey());
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.BACKGROUND_UPDATED));
    }

    // DELETE /api/boards/me/assets/background
    @DeleteMapping("/background")
    public ResponseEntity<ApiResponse<Void>> deleteBackground(
            @CurrentUser UserPrincipal principal) {
        boardAssetService.deleteBackground(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.BACKGROUND_DELETED));
    }

    // ===================== 스티커 =====================

    // GET /api/boards/me/assets/stickers
    @GetMapping("/stickers")
    public ResponseEntity<ApiResponse<StickerListResponse>> getStickers(
            @CurrentUser UserPrincipal principal) {
        StickerListResponse data = boardAssetService.getStickers(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.STICKER_FOUND, data));
    }

    // GET /api/boards/me/assets/stickers/{slotIndex}
    @GetMapping("/stickers/{slotIndex}")
    public ResponseEntity<ApiResponse<StickerResponse>> getSticker(
            @CurrentUser UserPrincipal principal,
            @PathVariable int slotIndex) {
        StickerResponse data = boardAssetService.getSticker(principal.getId(), slotIndex);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.STICKER_FOUND, data));
    }

    // PUT /api/boards/me/assets/stickers/{slotIndex}
    @PutMapping("/stickers/{slotIndex}")
    public ResponseEntity<ApiResponse<Void>> updateSticker(
            @CurrentUser UserPrincipal principal,
            @PathVariable int slotIndex,
            @Valid @RequestBody BoardAssetUpdateRequest request) {
        boardAssetService.updateSticker(principal.getId(), slotIndex, request.getAssetKey());
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.STICKER_UPDATED));
    }

    // DELETE /api/boards/me/assets/stickers/{slotIndex}
    @DeleteMapping("/stickers/{slotIndex}")
    public ResponseEntity<ApiResponse<Void>> deleteSticker(
            @CurrentUser UserPrincipal principal,
            @PathVariable int slotIndex) {
        boardAssetService.deleteSticker(principal.getId(), slotIndex);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.STICKER_DELETED));
    }
}
