package com.ssafy.oh_jjeom_oh.common.exception;

import com.ssafy.oh_jjeom_oh.common.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    protected ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Internal Server Error: ", e);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.fail("서버 내부 오류가 발생했습니다."));
    }

    // 1. @Valid 유효성 검사 실패 시 (아이디 길이, 비번 형식 등)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    protected ResponseEntity<ApiResponse<Void>> handleMethodArgumentNotValidException(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getAllErrors().get(0).getDefaultMessage();
        return ResponseEntity
                .badRequest()
                .body(ApiResponse.fail(message));
    }

    // 2. 비즈니스 예외 발생 시 (아이디 중복 등)
    @ExceptionHandler(CustomException.class)
    protected ResponseEntity<ApiResponse<Void>> handleCustomException(CustomException e) {
        return ResponseEntity
                .status(e.getErrorCode().getStatus())
                .body(ApiResponse.fail(e.getErrorCode().getMessage(), e.getErrorCode().name()));
    }

    // 3. 기타 런타임 예외
    @ExceptionHandler(IllegalArgumentException.class)
    protected ResponseEntity<ApiResponse<Void>> handleIllegalArgumentException(IllegalArgumentException e) {
        return ResponseEntity
                .badRequest()
                .body(ApiResponse.fail(e.getMessage()));
    }

    // 4. 파일 업로드 파라미터 누락 (400)
    @ExceptionHandler(MissingServletRequestPartException.class)
    protected ResponseEntity<ApiResponse<Void>> handleMissingServletRequestPartException(MissingServletRequestPartException e) {
        return ResponseEntity
                .badRequest()
                .body(ApiResponse.fail("업로드할 이미지 파일(image)이 필요합니다."));
    }
}
