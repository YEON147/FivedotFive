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
import org.springframework.web.multipart.MultipartFile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class FileServiceTest {

    @Mock
    private S3Service s3Service;

    @InjectMocks
    private FileService fileService;

    @Test
    @DisplayName("이미지 업로드 성공 - S3 키 생성 및 업로드 호출 확인")
    void uploadImage_Success() {
        // given
        MockMultipartFile file = new MockMultipartFile(
                "image",
                "test-image.png",
                "image/png",
                "test data".getBytes()
        );
        
        given(s3Service.uploadFile(eq(file), anyString())).willReturn("https://s3.url/images/recipient/uuid.png");

        // when
        ImageUploadResponse response = fileService.uploadImage(file);

        // then
        assertThat(response.imageKey()).startsWith("images/recipient/");
        assertThat(response.imageKey()).endsWith(".png");
        verify(s3Service).uploadFile(eq(file), anyString());
    }

    @Test
    @DisplayName("업로드 실패 - 지원하지 않는 확장자 (txt)")
    void uploadImage_Failure_InvalidExtension() {
        // given
        MockMultipartFile file = new MockMultipartFile(
                "image",
                "test.txt",
                "text/plain",
                "test data".getBytes()
        );

        // when & then
        assertThatThrownBy(() -> fileService.uploadImage(file))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.UNSUPPORTED_FILE_TYPE);
    }

    @Test
    @DisplayName("업로드 실패 - 빈 파일")
    void uploadImage_Failure_EmptyFile() {
        // given
        MockMultipartFile file = new MockMultipartFile(
                "image",
                "test.jpg",
                "image/jpeg",
                new byte[0]
        );

        // when & then
        assertThatThrownBy(() -> fileService.uploadImage(file))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT_VALUE);
    }

    @Test
    @DisplayName("업로드 실패 - 이미지 형식이 아닌 Content-Type")
    void uploadImage_Failure_InvalidContentType() {
        // given
        MockMultipartFile file = new MockMultipartFile(
                "image",
                "test.jpg",
                "application/pdf",
                "test data".getBytes()
        );

        // when & then
        assertThatThrownBy(() -> fileService.uploadImage(file))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.UNSUPPORTED_FILE_TYPE);
    }
}
