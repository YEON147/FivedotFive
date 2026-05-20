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
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishBoardSavedListResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishBoardSaveResponse;
import com.ssafy.oh_jjeom_oh.domain.me.dto.response.BoardSummaryResponse;
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

    // GET /api/boards/me - 위시보드+롤링페이퍼 중 가장 최근 생성된 원본 1개 조회
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<BoardSummaryResponse>> getMyLatestBoard(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        BoardSummaryResponse data = wishBoardService.getLatestBoard(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.LATEST_BOARD_FOUND, data));
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

    // PATCH /api/boards/{slug} - 위시보드 수정 (소유자) → success/message만 반환
    @PatchMapping("/{slug}")
    public ResponseEntity<ApiResponse<Void>> updateBoard(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String slug,
            @Valid @RequestBody WishBoardUpdateRequest request) {

        wishBoardService.updateBoard(userPrincipal.getId(), slug, request);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.BOARD_UPDATED));
    }

    // DELETE /api/boards/{slug} - 위시보드 삭제 (소유자)
    @DeleteMapping("/{slug}")
    public ResponseEntity<ApiResponse<Void>> deleteBoard(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String slug) {

        wishBoardService.deleteBoard(userPrincipal.getId(), slug);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.BOARD_DELETED));
    }

    // POST /api/boards/{slug}/save - 위시보드 독립 복사본 저장 (본인·타인 보드)
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
    public ResponseEntity<ApiResponse<WishBoardSavedListResponse>> getMySavedBoards(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        WishBoardSavedListResponse data = wishBoardService.getMySavedBoards(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.SAVED_BOARDS_FOUND, data));
    }

    // DELETE /api/boards/saved/{slug} - 저장된 복사본 삭제 (저장한 본인만)
    @DeleteMapping("/saved/{slug}")
    public ResponseEntity<ApiResponse<Void>> deleteSavedBoard(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String slug) {

        wishBoardService.deleteSavedBoard(userPrincipal.getId(), slug);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.BOARD_DELETED));
    }

    // GET /api/boards/{slug} - slug로 위시보드 조회 (공개·소유자 JWT·저장본 savedByUser)
    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<WishBoardPublicResponse>> getBoardBySlug(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String slug) {

        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        WishBoardPublicResponse data = wishBoardService.getBoardBySlug(userId, slug);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.BOARD_FOUND, data));
    }
}
