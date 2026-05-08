package com.ssafy.oh_jjeom_oh.domain.file.service;

import com.ssafy.oh_jjeom_oh.common.exception.CustomException;
import com.ssafy.oh_jjeom_oh.common.exception.ErrorCode;
import com.ssafy.oh_jjeom_oh.common.service.S3Service;
import com.ssafy.oh_jjeom_oh.domain.file.dto.response.ImageUploadResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileService {

    private final S3Service s3Service;

    public ImageUploadResponse uploadImage(MultipartFile file) {
        validateImageFile(file);

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "image.jpg";
        String extension = getExtension(originalFilename);
        
        // DDL 명세에 따른 경로: images/recipient/{uuid}.{ext}
        String s3Key = "images/recipient/" + UUID.randomUUID() + "." + extension;
        
        s3Service.uploadFile(file, s3Key);
        
        // 명세에 따라 CDN 키(imageKey)만 반환
        return ImageUploadResponse.of(s3Key);
    }

    private void validateImageFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new CustomException(ErrorCode.INVALID_INPUT_VALUE);
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new CustomException(ErrorCode.UNSUPPORTED_FILE_TYPE);
        }
    }

    private String getExtension(String filename) {
        int lastIdx = filename.lastIndexOf(".");
        if (lastIdx == -1) return "jpg";
        return filename.substring(lastIdx + 1);
    }
}
