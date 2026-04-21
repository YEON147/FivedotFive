package com.ssafy.oh_jjeom_oh.domain.board.controller;

import com.ssafy.oh_jjeom_oh.common.response.ApiResponse;
import com.ssafy.oh_jjeom_oh.common.security.CurrentUser;
import com.ssafy.oh_jjeom_oh.common.security.UserPrincipal;
import com.ssafy.oh_jjeom_oh.domain.board.dto.request.WishItemUpdateRequest;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishItemLikeResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishItemListResponse;
import com.ssafy.oh_jjeom_oh.domain.board.service.WishItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class WishItemController {

    private final WishItemService wishItemService;

    // GET /api/boards/me/items - 위시 아이템 슬롯 전체 조회 (CHILD)
    @GetMapping("/api/boards/me/items")
    public ResponseEntity<ApiResponse<WishItemListResponse>> getItems(
            @CurrentUser UserPrincipal userPrincipal) {

        WishItemListResponse data = wishItemService.getItems(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("위시 아이템 조회가 완료되었습니다.", data));
    }

    // PATCH /api/boards/me/items/{slotIndex} - 위시 아이템 슬롯 수정 (CHILD)
    @PatchMapping("/api/boards/me/items/{slotIndex}")
    public ResponseEntity<ApiResponse<Void>> updateItem(
            @CurrentUser UserPrincipal userPrincipal,
            @PathVariable int slotIndex,
            @Valid @RequestBody WishItemUpdateRequest request) {

        wishItemService.updateItem(userPrincipal.getId(), slotIndex, request);
        return ResponseEntity.ok(ApiResponse.success("위시 아이템이 수정되었습니다."));
    }

    // DELETE /api/boards/me/items/{slotIndex} - 위시 아이템 슬롯 비우기 (CHILD)
    @DeleteMapping("/api/boards/me/items/{slotIndex}")
    public ResponseEntity<ApiResponse<Void>> clearItem(
            @CurrentUser UserPrincipal userPrincipal,
            @PathVariable int slotIndex) {

        wishItemService.clearItem(userPrincipal.getId(), slotIndex);
        return ResponseEntity.ok(ApiResponse.success("위시 아이템이 삭제되었습니다."));
    }

    // POST /api/boards/{slug}/items/{slotIndex}/like - 위시 아이템 공감 (CHILD)
    @PostMapping("/api/boards/{slug}/items/{slotIndex}/like")
    public ResponseEntity<ApiResponse<WishItemLikeResponse>> likeItem(
            @CurrentUser UserPrincipal userPrincipal,
            @PathVariable String slug,
            @PathVariable int slotIndex) {

        WishItemLikeResponse data = wishItemService.likeItem(userPrincipal.getId(), slug, slotIndex);
        return ResponseEntity.ok(ApiResponse.success("공감이 반영되었습니다.", data));
    }
}
