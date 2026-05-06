package com.ssafy.oh_jjeom_oh.domain.board.controller;

import com.ssafy.oh_jjeom_oh.common.response.ApiResponse;
import com.ssafy.oh_jjeom_oh.common.response.SuccessMessage;
import com.ssafy.oh_jjeom_oh.common.security.UserPrincipal;
import com.ssafy.oh_jjeom_oh.domain.board.dto.request.WishBoardCreateRequest;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishBoardCreateResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishBoardExistsResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishBoardPublicResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishBoardResponse;
import com.ssafy.oh_jjeom_oh.domain.board.service.WishBoardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/boards")
@RequiredArgsConstructor
public class WishBoardController {

    private final WishBoardService wishBoardService;

    // POST /api/boards - 위시보드 생성 (CHILD, 최대 5개)
    @PostMapping
    public ResponseEntity<ApiResponse<WishBoardCreateResponse>> createBoard(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody(required = false) WishBoardCreateRequest request) {

        WishBoardCreateResponse data = wishBoardService.createBoard(userPrincipal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(SuccessMessage.BOARD_CREATED, data));
    }

    // GET /api/boards/me - 내 위시보드 목록 조회 (CHILD)
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<WishBoardResponse>>> getMyBoards(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        List<WishBoardResponse> data = wishBoardService.getMyBoards(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.BOARDS_FOUND, data));
    }

    // GET /api/boards/me/exists - 내 위시보드 존재 여부 조회 (CHILD)
    @GetMapping("/me/exists")
    public ResponseEntity<ApiResponse<WishBoardExistsResponse>> getMyBoardExists(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        WishBoardExistsResponse data = wishBoardService.getMyBoardExists(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.BOARD_EXISTS_CHECKED, data));
    }

    // GET /api/boards/{slug} - slug로 위시보드 조회 (Anyone)
    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<WishBoardPublicResponse>> getBoardBySlug(
            @PathVariable String slug) {

        WishBoardPublicResponse data = wishBoardService.getBoardBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.BOARD_FOUND, data));
    }
}
