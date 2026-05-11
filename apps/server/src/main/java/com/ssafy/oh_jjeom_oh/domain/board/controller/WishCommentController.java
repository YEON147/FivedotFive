package com.ssafy.oh_jjeom_oh.domain.board.controller;

import com.ssafy.oh_jjeom_oh.common.response.ApiResponse;
import com.ssafy.oh_jjeom_oh.common.response.SuccessMessage;
import com.ssafy.oh_jjeom_oh.common.security.UserPrincipal;
import com.ssafy.oh_jjeom_oh.domain.board.dto.request.CommentCreateRequest;
import com.ssafy.oh_jjeom_oh.domain.board.dto.request.CommentDeleteRequest;
import com.ssafy.oh_jjeom_oh.domain.board.dto.request.CommentStickerUpdateRequest;
import com.ssafy.oh_jjeom_oh.domain.board.dto.request.CommentUpdateRequest;
import com.ssafy.oh_jjeom_oh.domain.board.dto.request.CommentVerifyRequest;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.CommentCreateResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.CommentListResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.CommentStickerResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.CommentVerifyResponse;
import com.ssafy.oh_jjeom_oh.domain.board.service.WishCommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/boards/{slug}/comments")
public class WishCommentController {

    private final WishCommentService wishCommentService;

    // GET /api/boards/{slug}/comments?page=0&size=6 - 댓글 목록 조회 (Anyone)
    @GetMapping
    public ResponseEntity<ApiResponse<CommentListResponse>> getComments(
            @PathVariable String slug,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        CommentListResponse data = wishCommentService.getComments(slug, page, size, userId);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.COMMENT_LIST_FOUND, data));
    }

    // POST /api/boards/{slug}/comments - 댓글 작성 (Anyone)
    @PostMapping
    public ResponseEntity<ApiResponse<CommentCreateResponse>> createComment(
            @PathVariable String slug,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody CommentCreateRequest request) {

        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        CommentCreateResponse data = wishCommentService.createComment(userId, slug, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(SuccessMessage.COMMENT_CREATED, data));
    }

    // PATCH /api/boards/{slug}/comments/{commentId} - 댓글 수정 (Anyone, 본인만)
    @PatchMapping("/{commentId}")
    public ResponseEntity<ApiResponse<Void>> updateComment(
            @PathVariable String slug,
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody CommentUpdateRequest request) {

        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        wishCommentService.updateComment(userId, slug, commentId, request);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.COMMENT_UPDATED));
    }

    // POST /api/boards/{slug}/comments/{commentId}/verify - 비회원 댓글 비밀번호 검증 (Anyone)
    @PostMapping("/{commentId}/verify")
    public ResponseEntity<ApiResponse<CommentVerifyResponse>> verifyPassword(
            @PathVariable String slug,
            @PathVariable Long commentId,
            @Valid @RequestBody CommentVerifyRequest request) {

        CommentVerifyResponse data = wishCommentService.verifyPassword(slug, commentId, request);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.COMMENT_VERIFIED, data));
    }

    // DELETE /api/boards/{slug}/comments/{commentId} - 댓글 삭제 (Anyone, 본인만)
    @DeleteMapping("/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable String slug,
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody(required = false) CommentDeleteRequest request) {

        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        String verifyToken = request != null ? request.getVerifyToken() : null;
        wishCommentService.deleteComment(userId, slug, commentId, verifyToken);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.COMMENT_DELETED));
    }

    // GET /api/boards/{slug}/comments/{commentId}/sticker - 선물 아이콘 조회 (Anyone)
    @GetMapping("/{commentId}/sticker")
    public ResponseEntity<ApiResponse<CommentStickerResponse>> getSticker(
            @PathVariable String slug,
            @PathVariable Long commentId) {

        CommentStickerResponse data = wishCommentService.getSticker(slug, commentId);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.COMMENT_STICKER_FOUND, data));
    }

    // PUT /api/boards/{slug}/comments/{commentId}/sticker - 선물 아이콘 변경 (본인만)
    @PutMapping("/{commentId}/sticker")
    public ResponseEntity<ApiResponse<Void>> updateSticker(
            @PathVariable String slug,
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody CommentStickerUpdateRequest request) {

        wishCommentService.updateSticker(userPrincipal.getId(), slug, commentId, request);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.COMMENT_STICKER_UPDATED));
    }

    // DELETE /api/boards/{slug}/comments/{commentId}/sticker - 선물 아이콘 삭제 (ADMIN)
    @DeleteMapping("/{commentId}/sticker")
    public ResponseEntity<ApiResponse<Void>> deleteSticker(
            @PathVariable String slug,
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        wishCommentService.deleteSticker(userPrincipal.getId(), slug, commentId);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.COMMENT_STICKER_DELETED));
    }
}
