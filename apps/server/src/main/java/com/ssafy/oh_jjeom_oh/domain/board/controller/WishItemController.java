package com.ssafy.oh_jjeom_oh.domain.board.controller;

import com.ssafy.oh_jjeom_oh.common.response.ApiResponse;
import com.ssafy.oh_jjeom_oh.common.response.SuccessMessage;
import com.ssafy.oh_jjeom_oh.common.security.UserPrincipal;
import com.ssafy.oh_jjeom_oh.domain.board.dto.request.WishItemUpdateRequest;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishItemLikeResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishItemListResponse;
import com.ssafy.oh_jjeom_oh.domain.board.service.WishItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class WishItemController {

    private final WishItemService wishItemService;

    // GET /api/boards/{slug}/items - 위시 아이템 슬롯 전체 조회
    @GetMapping("/api/boards/{slug}/items")
    public ResponseEntity<ApiResponse<WishItemListResponse>> getItems(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String slug) {

        WishItemListResponse data = wishItemService.getItems(slug, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.WISH_ITEM_FOUND, data));
    }

    // PATCH /api/boards/{slug}/items/{slotIndex} - 위시 아이템 슬롯 수정
    @PatchMapping("/api/boards/{slug}/items/{slotIndex}")
    public ResponseEntity<ApiResponse<Void>> updateItem(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String slug,
            @PathVariable int slotIndex,
            @Valid @RequestBody WishItemUpdateRequest request) {

        wishItemService.updateItem(slug, userPrincipal.getId(), slotIndex, request);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.WISH_ITEM_UPDATED));
    }

    // DELETE /api/boards/{slug}/items/{slotIndex} - 위시 아이템 슬롯 비우기
    @DeleteMapping("/api/boards/{slug}/items/{slotIndex}")
    public ResponseEntity<ApiResponse<Void>> clearItem(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String slug,
            @PathVariable int slotIndex) {

        wishItemService.clearItem(slug, userPrincipal.getId(), slotIndex);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.WISH_ITEM_DELETED));
    }

    // POST /api/boards/{slug}/items/{slotIndex}/like - 위시 아이템 공감
    @PostMapping("/api/boards/{slug}/items/{slotIndex}/like")
    public ResponseEntity<ApiResponse<WishItemLikeResponse>> likeItem(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String slug,
            @PathVariable int slotIndex) {

        WishItemLikeResponse data = wishItemService.likeItem(userPrincipal.getId(), slug, slotIndex);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.WISH_ITEM_LIKED, data));
    }
}
