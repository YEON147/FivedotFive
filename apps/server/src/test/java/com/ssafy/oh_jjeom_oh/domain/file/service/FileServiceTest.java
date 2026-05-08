package com.ssafy.oh_jjeom_oh.domain.file.service;

import com.ssafy.oh_jjeom_oh.common.exception.CustomException;
import com.ssafy.oh_jjeom_oh.common.exception.ErrorCode;
import com.ssafy.oh_jjeom_oh.common.service.S3Service;
import com.ssafy.oh_jjeom_oh.domain.file.dto.response.ImageUploadResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FileServiceTest {

    @InjectMocks
    private FileService fileService;

    @Mock
    private S3Service s3Service;

    @Mock
    private GmsService gmsService;

    @Test
    @DisplayName("AI 캐릭터 생성 및 업로드 성공 테스트")
    void uploadImage_Success() {
        // given
        MockMultipartFile file = new MockMultipartFile(
                "image", "test.jpg", "image/jpeg", "test data".getBytes());
        byte[] aiResult = "ai generated data".getBytes();

        given(gmsService.generateCharacterImage(any())).willReturn(aiResult);
        given(s3Service.uploadFile(any(byte[].class), anyString(), anyString())).willReturn("https://s3/path");

        // when
        ImageUploadResponse response = fileService.uploadImage(file);

        // then
        assertThat(response.imageKey()).startsWith("images/characters/");
        verify(gmsService, times(1)).generateCharacterImage(any());
        verify(s3Service, times(1)).uploadFile(any(byte[].class), anyString(), anyString());
    }

    @Test
    @DisplayName("이미지가 아닌 파일을 업로드할 경우 예외 발생")
    void uploadImage_UnsupportedFileType() {
        // given
        MockMultipartFile file = new MockMultipartFile(
                "image", "test.txt", "text/plain", "test data".getBytes());

        // when & then
        assertThatThrownBy(() -> fileService.uploadImage(file))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.UNSUPPORTED_FILE_TYPE);
    }

    @Test
    @DisplayName("AI 생성 실패 시 예외 전파 테스트")
    void uploadImage_AiGenerationFail() {
        // given
        MockMultipartFile file = new MockMultipartFile(
                "image", "test.jpg", "image/jpeg", "test data".getBytes());

        given(gmsService.generateCharacterImage(any()))
                .willThrow(new CustomException(ErrorCode.AI_GENERATION_FAILED));

        // when & then
        assertThatThrownBy(() -> fileService.uploadImage(file))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.AI_GENERATION_FAILED);
    }
}
