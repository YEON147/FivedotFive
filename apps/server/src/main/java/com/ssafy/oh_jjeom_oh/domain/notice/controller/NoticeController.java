package com.ssafy.oh_jjeom_oh.domain.notice.controller;

import com.ssafy.oh_jjeom_oh.common.response.ApiResponse;
import com.ssafy.oh_jjeom_oh.common.response.SuccessMessage;
import com.ssafy.oh_jjeom_oh.domain.notice.dto.response.BannerListResponse;
import com.ssafy.oh_jjeom_oh.domain.notice.dto.response.NoticeDetailResponse;
import com.ssafy.oh_jjeom_oh.domain.notice.dto.response.NoticeListResponse;
import com.ssafy.oh_jjeom_oh.domain.notice.service.NoticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;

    // GET /api/notices - 공지사항 목록 조회 (Anyone)
    @GetMapping
    public ResponseEntity<ApiResponse<NoticeListResponse>> getNotices() {
        NoticeListResponse data = noticeService.getNotices();
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.NOTICE_LIST_FOUND, data));
    }

    // GET /api/notices/banners - 배너 목록 조회 (Anyone)
    @GetMapping("/banners")
    public ResponseEntity<ApiResponse<BannerListResponse>> getBanners() {
        BannerListResponse data = noticeService.getBanners();
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.BANNER_LIST_FOUND, data));
    }

    // GET /api/notices/{id} - 공지사항 상세 조회 (Anyone)
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<NoticeDetailResponse>> getNotice(@PathVariable Long id) {
        NoticeDetailResponse data = noticeService.getNotice(id);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.NOTICE_FOUND, data));
    }
}
