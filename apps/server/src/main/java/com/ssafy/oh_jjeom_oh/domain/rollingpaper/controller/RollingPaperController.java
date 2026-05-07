package com.ssafy.oh_jjeom_oh.domain.rollingpaper.controller;

import com.ssafy.oh_jjeom_oh.common.response.ApiResponse;
import com.ssafy.oh_jjeom_oh.common.response.SuccessMessage;
import com.ssafy.oh_jjeom_oh.common.security.UserPrincipal;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.request.RollingPaperCreateRequest;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.request.RollingPaperUpdateRequest;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response.RollingPaperCreateResponse;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response.RollingPaperDetailResponse;
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

    // GET /api/rolling-papers/{slug}?token={token} - 단건 조회 (토큰 또는 소유자)
    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<RollingPaperDetailResponse>> getRollingPaper(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String slug,
            @RequestParam(required = false) String token) {

        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        RollingPaperDetailResponse data = rollingPaperService.getRollingPaper(userId, slug, token);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.ROLLING_PAPER_FOUND, data));
    }

    // PATCH /api/rolling-papers/{slug} - 롤링페이퍼 수정 (소유자)
    @PatchMapping("/{slug}")
    public ResponseEntity<ApiResponse<RollingPaperDetailResponse>> updateRollingPaper(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String slug,
            @Valid @RequestBody RollingPaperUpdateRequest request) {

        RollingPaperDetailResponse data = rollingPaperService.updateRollingPaper(userPrincipal.getId(), slug, request);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.ROLLING_PAPER_UPDATED, data));
    }

    // DELETE /api/rolling-papers/{slug} - 롤링페이퍼 삭제 (소유자)
    @DeleteMapping("/{slug}")
    public ResponseEntity<ApiResponse<Void>> deleteRollingPaper(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String slug) {

        rollingPaperService.deleteRollingPaper(userPrincipal.getId(), slug);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.ROLLING_PAPER_DELETED));
    }
}
