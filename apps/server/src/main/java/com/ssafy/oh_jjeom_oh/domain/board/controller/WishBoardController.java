package com.ssafy.oh_jjeom_oh.domain.board.controller;

import com.ssafy.oh_jjeom_oh.common.response.ApiResponse;
import com.ssafy.oh_jjeom_oh.common.response.SuccessMessage;
import com.ssafy.oh_jjeom_oh.common.security.UserPrincipal;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishBoardCreateResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishBoardPublicResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishBoardResponse;
import com.ssafy.oh_jjeom_oh.domain.board.service.WishBoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/boards")
@RequiredArgsConstructor
public class WishBoardController {

    private final WishBoardService wishBoardService;

    // POST /api/boards - 위시보드 생성 (CHILD)
    @PostMapping
    public ResponseEntity<ApiResponse<WishBoardCreateResponse>> createBoard(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        WishBoardCreateResponse data = wishBoardService.createBoard(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.BOARD_CREATED, data));
    }

    // GET /api/boards/me - 내 위시보드 조회 (CHILD)
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<WishBoardResponse>> getMyBoard(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        WishBoardResponse data = wishBoardService.getMyBoard(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.BOARD_FOUND, data));
    }

    // GET /api/boards/{slug} - slug로 위시보드 조회 (Anyone)
    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<WishBoardPublicResponse>> getBoardBySlug(
            @PathVariable String slug) {

        WishBoardPublicResponse data = wishBoardService.getBoardBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.BOARD_FOUND, data));
    }
}
