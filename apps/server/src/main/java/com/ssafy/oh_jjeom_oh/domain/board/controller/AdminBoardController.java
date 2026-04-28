package com.ssafy.oh_jjeom_oh.domain.board.controller;

import com.ssafy.oh_jjeom_oh.common.response.ApiResponse;
import com.ssafy.oh_jjeom_oh.common.response.SuccessMessage;
import com.ssafy.oh_jjeom_oh.domain.board.service.WishBoardService;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/boards")
@RequiredArgsConstructor
public class AdminBoardController {

    private final WishBoardService wishBoardService;

    /**
     * PUT /api/admin/boards/{slug}/visibility
     * 관리자가 특정 보드의 공개 여부를 강제로 변경합니다.
     * 저작권 이슈 발생 시 구단 보드를 비공개로 전환하는 데 사용합니다.
     */
    @PutMapping("/{slug}/visibility")
    public ResponseEntity<ApiResponse<Void>> updateVisibility(
            @PathVariable String slug,
            @RequestBody VisibilityRequest request) {
        wishBoardService.updateBoardVisibility(slug, request.getIsPublic());
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.BOARD_VISIBILITY_UPDATED));
    }

    @Getter
    @NoArgsConstructor
    static class VisibilityRequest {
        @JsonProperty("isPublic")
        private Boolean isPublic;
    }
}
