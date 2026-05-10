package com.ssafy.oh_jjeom_oh.domain.file.service;

import com.ssafy.oh_jjeom_oh.common.exception.CustomException;
import com.ssafy.oh_jjeom_oh.common.exception.ErrorCode;
import com.ssafy.oh_jjeom_oh.common.service.S3Service;
import com.ssafy.oh_jjeom_oh.domain.file.dto.response.ImageUploadResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

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

    @BeforeEach
    void setUp() {
        // 테스트 필드 기본값 설정 (application.yml 값 모사)
        ReflectionTestUtils.setField(fileService, "aiEnabled", true);
        ReflectionTestUtils.setField(fileService, "fallbackOnAiFailure", false);
    }

    @Test
    @DisplayName("Gemini AI 캐릭터 생성 및 업로드 성공 테스트")
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
    @DisplayName("AI 기능이 비활성화된 경우 원본 이미지 저장 테스트")
    void uploadImage_AiDisabled() {
        // given
        ReflectionTestUtils.setField(fileService, "aiEnabled", false);
        MockMultipartFile file = new MockMultipartFile(
                "image", "test.jpg", "image/jpeg", "test data".getBytes());

        // when
        ImageUploadResponse response = fileService.uploadImage(file);

        // then
        assertThat(response.imageKey()).startsWith("images/characters/");
        verify(gmsService, never()).generateCharacterImage(any());
        verify(s3Service, times(1)).uploadFile(any(), anyString());
    }

    @Test
    @DisplayName("AI 생성 실패 시 폴백(원본 저장) 작동 테스트")
    void uploadImage_FallbackSuccess() {
        // given
        ReflectionTestUtils.setField(fileService, "fallbackOnAiFailure", true);
        MockMultipartFile file = new MockMultipartFile(
                "image", "test.jpg", "image/jpeg", "test data".getBytes());

        given(gmsService.generateCharacterImage(any()))
                .willThrow(new CustomException(ErrorCode.AI_GENERATION_FAILED));

        // when
        ImageUploadResponse response = fileService.uploadImage(file);

        // then
        assertThat(response.imageKey()).startsWith("images/characters/");
        verify(s3Service, times(1)).uploadFile(any(), anyString()); // 원본 업로드 호출됨
    }

    @Test
    @DisplayName("폴백 비활성화 상태에서 AI 실패 시 예외 발생 테스트")
    void uploadImage_FallbackDisabled_Fail() {
        // given
        ReflectionTestUtils.setField(fileService, "fallbackOnAiFailure", false);
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
