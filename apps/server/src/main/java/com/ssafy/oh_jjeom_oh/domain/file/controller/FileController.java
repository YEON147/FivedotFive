package com.ssafy.oh_jjeom_oh.domain.file.controller;

import com.ssafy.oh_jjeom_oh.common.response.ApiResponse;
import com.ssafy.oh_jjeom_oh.common.response.SuccessMessage;
import com.ssafy.oh_jjeom_oh.domain.file.dto.response.ImageUploadResponse;
import com.ssafy.oh_jjeom_oh.domain.file.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ImageUploadResponse>> uploadImage(
            @RequestPart("image") MultipartFile image
    ) {
        ImageUploadResponse data = fileService.uploadImage(image);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(SuccessMessage.IMAGE_UPLOADED, data));
    }
}
