package com.ssafy.oh_jjeom_oh.domain.file.service;

import com.ssafy.oh_jjeom_oh.common.exception.CustomException;
import com.ssafy.oh_jjeom_oh.common.exception.ErrorCode;
import com.ssafy.oh_jjeom_oh.common.service.S3Service;
import com.ssafy.oh_jjeom_oh.domain.file.dto.response.ImageUploadResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileService {

    private final S3Service s3Service;
    private final GmsService gmsService;

    @Value("${gms.ai-enabled:true}")
    private boolean aiEnabled;

    @Value("${gms.fallback-on-ai-failure:false}")
    private boolean fallbackOnAiFailure;

    /**
     * 이미지를 받아 AI 캐릭터를 생성하고 S3에 저장한 뒤 경로를 반환합니다.
     */
    public ImageUploadResponse uploadImage(MultipartFile sourceImage) {
        validateImageFile(sourceImage);

        // 1. AI 기능 비활성화 시 원본 저장
        if (!aiEnabled) {
            log.info("AI 기능 비활성화 상태: 원본 이미지를 업로드합니다.");
            return uploadOriginalAsCharacter(sourceImage);
        }

        try {
            // 2. AI 캐릭터 생성 시도
            byte[] aiImageBytes = gmsService.generateCharacterImage(sourceImage);
            String s3Key = "images/characters/" + UUID.randomUUID() + ".png";
            s3Service.uploadFile(aiImageBytes, s3Key, "image/png");
            return ImageUploadResponse.of(s3Key);

        } catch (CustomException e) {
            // 3. AI 실패 시 폴백 여부 확인
            if (fallbackOnAiFailure && e.getErrorCode() == ErrorCode.AI_GENERATION_FAILED) {
                log.warn("AI 생성 실패: 설정에 따라 원본 이미지로 대체합니다.");
                return uploadOriginalAsCharacter(sourceImage);
            }
            throw e;
        }
    }

    private ImageUploadResponse uploadOriginalAsCharacter(MultipartFile file) {
        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "image.png";
        String s3Key = "images/characters/" + UUID.randomUUID() + ".png";
        s3Service.uploadFile(file, s3Key);
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
