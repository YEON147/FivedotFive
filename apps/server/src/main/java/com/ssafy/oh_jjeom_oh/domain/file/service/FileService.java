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
    private final GmsService gmsService;

    /**
     * 이미지를 받아 AI 캐릭터를 생성하고 S3에 저장한 뒤 경로를 반환합니다.
     */
    public ImageUploadResponse uploadImage(MultipartFile sourceImage) {
        validateImageFile(sourceImage);

        byte[] aiImageBytes = gmsService.generateCharacterImage(sourceImage);
        String s3Key = "images/characters/" + UUID.randomUUID() + ".png";
        s3Service.uploadFile(aiImageBytes, s3Key, "image/png");
        return ImageUploadResponse.of(s3Key);
    }

    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new CustomException(ErrorCode.INVALID_INPUT_VALUE);
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new CustomException(ErrorCode.UNSUPPORTED_FILE_TYPE);
        }
    }
}
