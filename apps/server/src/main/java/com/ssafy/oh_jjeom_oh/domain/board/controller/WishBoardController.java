package com.ssafy.oh_jjeom_oh.domain.board.controller;

import com.ssafy.oh_jjeom_oh.common.response.ApiResponse;
import com.ssafy.oh_jjeom_oh.common.response.SuccessMessage;
import com.ssafy.oh_jjeom_oh.common.security.UserPrincipal;
import com.ssafy.oh_jjeom_oh.domain.board.dto.request.WishBoardCreateRequest;
import com.ssafy.oh_jjeom_oh.domain.board.dto.request.WishBoardUpdateRequest;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishBoardCreateResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishBoardExistsResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishBoardPublicResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishBoardResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishBoardSaveResponse;
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

    // GET /api/boards/me - 내 첫 번째 위시보드 단건 조회 (CHILD, 기존 프론트 호환)
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<WishBoardResponse>> getMyBoard(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        WishBoardResponse data = wishBoardService.getMyBoard(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.BOARD_FOUND, data));
    }

    // GET /api/boards/me/list - 내 위시보드 목록 조회 (CHILD, 다중 보드 지원)
    @GetMapping("/me/list")
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

    // PATCH /api/boards/{slug} - 위시보드 수정 (소유자)
    @PatchMapping("/{slug}")
    public ResponseEntity<ApiResponse<WishBoardResponse>> updateBoard(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String slug,
            @Valid @RequestBody WishBoardUpdateRequest request) {

        WishBoardResponse data = wishBoardService.updateBoard(userPrincipal.getId(), slug, request);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.BOARD_UPDATED, data));
    }

    // DELETE /api/boards/{slug} - 위시보드 삭제 (소유자)
    @DeleteMapping("/{slug}")
    public ResponseEntity<ApiResponse<Void>> deleteBoard(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String slug) {

        wishBoardService.deleteBoard(userPrincipal.getId(), slug);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.BOARD_DELETED));
    }

    // POST /api/boards/{slug}/save - 위시보드 독립 복사본 저장 (타인 보드)
    @PostMapping("/{slug}/save")
    public ResponseEntity<ApiResponse<WishBoardSaveResponse>> saveBoard(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String slug) {

        WishBoardSaveResponse data = wishBoardService.saveBoard(userPrincipal.getId(), slug);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(SuccessMessage.BOARD_SAVED, data));
    }

    // GET /api/boards/me/saved - 내가 저장한 위시보드 복사본 목록 조회
    @GetMapping("/me/saved")
    public ResponseEntity<ApiResponse<List<WishBoardResponse>>> getMySavedBoards(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        List<WishBoardResponse> data = wishBoardService.getMySavedBoards(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.SAVED_BOARDS_FOUND, data));
    }

    // GET /api/boards/{slug} - slug로 위시보드 조회 (Anyone)
    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<WishBoardPublicResponse>> getBoardBySlug(
            @PathVariable String slug) {

        WishBoardPublicResponse data = wishBoardService.getBoardBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.BOARD_FOUND, data));
    }
}
