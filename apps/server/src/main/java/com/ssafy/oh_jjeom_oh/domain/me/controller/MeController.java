package com.ssafy.oh_jjeom_oh.domain.me.controller;

import com.ssafy.oh_jjeom_oh.common.response.ApiResponse;
import com.ssafy.oh_jjeom_oh.common.response.SuccessMessage;
import com.ssafy.oh_jjeom_oh.common.security.UserPrincipal;
import com.ssafy.oh_jjeom_oh.domain.me.dto.response.BoardSummaryResponse;
import com.ssafy.oh_jjeom_oh.domain.me.service.MeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/me")
public class MeController {

    private final MeService meService;

    // GET /api/me/boards-all - 위시보드 + 롤링페이퍼 원본 통합 목록 (최신순)
    @GetMapping("/boards-all")
    public ResponseEntity<ApiResponse<List<BoardSummaryResponse>>> getBoardsAll(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        List<BoardSummaryResponse> data = meService.getBoardsAll(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.BOARDS_ALL_FOUND, data));
    }
}
