package com.ssafy.oh_jjeom_oh.domain.rollingpaper.controller;

import com.ssafy.oh_jjeom_oh.common.response.ApiResponse;
import com.ssafy.oh_jjeom_oh.common.response.SuccessMessage;
import com.ssafy.oh_jjeom_oh.common.security.UserPrincipal;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.request.RollingPaperCommentCreateRequest;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.request.RollingPaperCommentDeleteRequest;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.request.RollingPaperCommentUpdateRequest;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response.RollingPaperCommentCreateResponse;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response.RollingPaperCommentListResponse;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.service.RollingPaperCommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/rolling-papers/{slug}/comments")
public class RollingPaperCommentController {

    private final RollingPaperCommentService rollingPaperCommentService;

    // GET /api/rolling-papers/{slug}/comments?page=0&size=6&token=...
    @GetMapping
    public ResponseEntity<ApiResponse<RollingPaperCommentListResponse>> getComments(
            @PathVariable String slug,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size,
            @RequestParam(required = false) String token,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        RollingPaperCommentListResponse data =
                rollingPaperCommentService.getComments(slug, page, size, userId, token);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.RP_COMMENT_LIST_FOUND, data));
    }

    // POST /api/rolling-papers/{slug}/comments?token=...
    @PostMapping
    public ResponseEntity<ApiResponse<RollingPaperCommentCreateResponse>> createComment(
            @PathVariable String slug,
            @RequestParam(required = false) String token,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody RollingPaperCommentCreateRequest request) {

        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        RollingPaperCommentCreateResponse data =
                rollingPaperCommentService.createComment(userId, slug, token, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(SuccessMessage.RP_COMMENT_CREATED, data));
    }

    // PATCH /api/rolling-papers/{slug}/comments/{commentId}
    @PatchMapping("/{commentId}")
    public ResponseEntity<ApiResponse<Void>> updateComment(
            @PathVariable String slug,
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody RollingPaperCommentUpdateRequest request) {

        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        rollingPaperCommentService.updateComment(userId, slug, commentId, request);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.RP_COMMENT_UPDATED));
    }

    // DELETE /api/rolling-papers/{slug}/comments/{commentId}
    @DeleteMapping("/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable String slug,
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody(required = false) RollingPaperCommentDeleteRequest request) {

        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        String guestPassword = request != null ? request.getGuestPassword() : null;
        rollingPaperCommentService.deleteComment(userId, slug, commentId, guestPassword);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.RP_COMMENT_DELETED));
    }
}
