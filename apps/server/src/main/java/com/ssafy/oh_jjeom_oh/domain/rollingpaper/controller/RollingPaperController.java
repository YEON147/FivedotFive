package com.ssafy.oh_jjeom_oh.domain.rollingpaper.controller;

import com.ssafy.oh_jjeom_oh.common.response.ApiResponse;
import com.ssafy.oh_jjeom_oh.common.response.SuccessMessage;
import com.ssafy.oh_jjeom_oh.common.security.UserPrincipal;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.request.RollingPaperCreateRequest;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.request.RollingPaperUpdateRequest;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response.RollingPaperCreateResponse;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response.RollingPaperDetailResponse;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response.RollingPaperSavedListResponse;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response.RollingPaperSaveResponse;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response.RollingPaperShareLinkResponse;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response.RollingPaperSummaryResponse;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.service.RollingPaperService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rolling-papers")
@RequiredArgsConstructor
public class RollingPaperController {

    private final RollingPaperService rollingPaperService;

    // POST /api/rolling-papers - 롤링페이퍼 생성 (CHILD, 최대 5개)
    @PostMapping
    public ResponseEntity<ApiResponse<RollingPaperCreateResponse>> createRollingPaper(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody RollingPaperCreateRequest request) {

        RollingPaperCreateResponse data = rollingPaperService.createRollingPaper(userPrincipal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(SuccessMessage.ROLLING_PAPER_CREATED, data));
    }

    // GET /api/rolling-papers/me/list - 내 롤링페이퍼 목록 (원본만, 최신순)
    @GetMapping("/me/list")
    public ResponseEntity<ApiResponse<List<RollingPaperSummaryResponse>>> getMyRollingPapers(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        List<RollingPaperSummaryResponse> data = rollingPaperService.getMyRollingPapers(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.ROLLING_PAPER_LIST_FOUND, data));
    }

    // GET /api/rolling-papers/{slug} - 단건 조회 (X-Rolling-Token 헤더 또는 소유자)
    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<RollingPaperDetailResponse>> getRollingPaper(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String slug,
            @RequestHeader(value = "X-Rolling-Token", required = false) String token) {

        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        RollingPaperDetailResponse data = rollingPaperService.getRollingPaper(userId, slug, token);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.ROLLING_PAPER_FOUND, data));
    }

    // PATCH /api/rolling-papers/{slug} - 롤링페이퍼 수정 (소유자) → data 없이 success/message만 반환
    @PatchMapping("/{slug}")
    public ResponseEntity<ApiResponse<Void>> updateRollingPaper(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String slug,
            @Valid @RequestBody RollingPaperUpdateRequest request) {

        rollingPaperService.updateRollingPaper(userPrincipal.getId(), slug, request);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.ROLLING_PAPER_UPDATED));
    }

    // DELETE /api/rolling-papers/{slug} - 롤링페이퍼 삭제 (소유자)
    @DeleteMapping("/{slug}")
    public ResponseEntity<ApiResponse<Void>> deleteRollingPaper(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String slug) {

        rollingPaperService.deleteRollingPaper(userPrincipal.getId(), slug);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.ROLLING_PAPER_DELETED));
    }

    // POST /api/rolling-papers/{slug}/save - 소유자(CREATED) 또는 viewToken 소지자(RECEIVED)만 저장 가능
    @PostMapping("/{slug}/save")
    public ResponseEntity<ApiResponse<RollingPaperSaveResponse>> saveRollingPaper(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String slug,
            @RequestHeader(value = "X-Rolling-Token", required = false) String token) {

        RollingPaperSaveResponse data = rollingPaperService.saveRollingPaper(userPrincipal.getId(), slug, token);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(SuccessMessage.ROLLING_PAPER_SAVED, data));
    }

    // POST /api/rolling-papers/{slug}/share/comment - 댓글 작성용 단축 링크 재생성 (소유자)
    @PostMapping("/{slug}/share/comment")
    public ResponseEntity<ApiResponse<RollingPaperShareLinkResponse>> generateCommentShareLink(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String slug) {

        RollingPaperShareLinkResponse data = rollingPaperService.generateCommentShareLink(userPrincipal.getId(), slug);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.RP_SHARE_COMMENT_CREATED, data));
    }

    // POST /api/rolling-papers/{slug}/share/view - 저장 전용 단축 링크 재생성 (소유자)
    @PostMapping("/{slug}/share/view")
    public ResponseEntity<ApiResponse<RollingPaperShareLinkResponse>> generateViewShareLink(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String slug) {

        RollingPaperShareLinkResponse data = rollingPaperService.generateViewShareLink(userPrincipal.getId(), slug);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.RP_SHARE_VIEW_CREATED, data));
    }

    // GET /api/rolling-papers/me/saved - 내가 저장한 롤링페이퍼 복사본 목록
    @GetMapping("/me/saved")
    public ResponseEntity<ApiResponse<RollingPaperSavedListResponse>> getMySavedRollingPapers(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        RollingPaperSavedListResponse data = rollingPaperService.getMySavedRollingPapers(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.SAVED_ROLLING_PAPERS_FOUND, data));
    }

    // DELETE /api/rolling-papers/saved/{slug} - 저장된 복사본 삭제 (저장한 본인만)
    @DeleteMapping("/saved/{slug}")
    public ResponseEntity<ApiResponse<Void>> deleteSavedRollingPaper(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String slug) {

        rollingPaperService.deleteSavedRollingPaper(userPrincipal.getId(), slug);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.ROLLING_PAPER_DELETED));
    }
}
