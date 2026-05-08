package com.ssafy.oh_jjeom_oh.domain.file.controller;

import com.ssafy.oh_jjeom_oh.common.response.ApiResponse;
import com.ssafy.oh_jjeom_oh.common.response.SuccessMessage;
import com.ssafy.oh_jjeom_oh.domain.file.dto.response.ImageUploadResponse;
import com.ssafy.oh_jjeom_oh.domain.file.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    /**
     * AI 캐릭터 생성 및 업로드 API
     * 유저가 올린 이미지를 기반으로 AI 캐릭터를 생성하여 S3에 저장하고 경로를 반환합니다.
     */
    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ImageUploadResponse>> uploadImage(
            @RequestPart("image") MultipartFile image
    ) {
        ImageUploadResponse data = fileService.uploadImage(image);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(SuccessMessage.CHARACTER_GENERATED, data));
    }
}
