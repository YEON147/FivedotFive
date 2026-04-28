package com.ssafy.oh_jjeom_oh.domain.notice.controller;

import com.ssafy.oh_jjeom_oh.common.response.ApiResponse;
import com.ssafy.oh_jjeom_oh.common.response.SuccessMessage;
import com.ssafy.oh_jjeom_oh.domain.notice.dto.request.NoticeCreateRequest;
import com.ssafy.oh_jjeom_oh.domain.notice.dto.request.NoticeUpdateRequest;
import com.ssafy.oh_jjeom_oh.domain.notice.dto.response.NoticeCreateResponse;
import com.ssafy.oh_jjeom_oh.domain.notice.service.NoticeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin/notices")
@RequiredArgsConstructor
public class AdminNoticeController {

    private final NoticeService noticeService;

    // POST /api/admin/notices - 공지사항 작성 (ADMIN)
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<NoticeCreateResponse>> createNotice(
            @RequestPart("request") @Valid NoticeCreateRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) {
        NoticeCreateResponse data = noticeService.createNotice(request, images);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(SuccessMessage.NOTICE_CREATED, data));
    }

    // PUT /api/admin/notices/{id} - 공지사항 수정 (ADMIN)
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Void>> updateNotice(
            @PathVariable Long id,
            @RequestPart("request") NoticeUpdateRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) {
        noticeService.updateNotice(id, request, images);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.NOTICE_UPDATED));
    }

    // DELETE /api/admin/notices/{id} - 공지사항 삭제 (ADMIN)
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotice(@PathVariable Long id) {
        noticeService.deleteNotice(id);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.NOTICE_DELETED));
    }
}
