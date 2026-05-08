package com.ssafy.oh_jjeom_oh.domain.share.controller;

import com.ssafy.oh_jjeom_oh.common.response.ApiResponse;
import com.ssafy.oh_jjeom_oh.common.response.SuccessMessage;
import com.ssafy.oh_jjeom_oh.common.security.UserPrincipal;
import com.ssafy.oh_jjeom_oh.domain.share.dto.response.ShareLinkResponse;
import com.ssafy.oh_jjeom_oh.domain.share.service.ShareService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class ShareController {

    private final ShareService shareService;

    // POST /api/boards/{slug}/share - 공유 단축 링크 생성 (인증 필요, 본인 보드만)
    @PostMapping("/api/boards/{slug}/share")
    public ResponseEntity<ApiResponse<ShareLinkResponse>> createShareLink(
            @PathVariable String slug,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        String shortUrl = shareService.generateShareLink(userPrincipal.getId(), slug);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.SHARE_LINK_CREATED, ShareLinkResponse.of(shortUrl)));
    }

    // GET /share/{shortCode} - 단축 링크 redirect (인증 불필요)
    @GetMapping("/share/{shortCode}")
    public ResponseEntity<Void> redirect(@PathVariable String shortCode) {
        String originalUrl = shareService.resolveShortCode(shortCode);
        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, originalUrl)
                .build();
    }
}
