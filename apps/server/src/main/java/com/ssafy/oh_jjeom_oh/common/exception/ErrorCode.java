package com.ssafy.oh_jjeom_oh.common.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum ErrorCode {
    DUPLICATE_ID(HttpStatus.BAD_REQUEST, "이미 사용 중인 아이디입니다."),
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "입력 값이 올바르지 않습니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류가 발생했습니다."),

    LOGIN_FAILED(HttpStatus.BAD_REQUEST, "아이디 또는 비밀번호가 올바르지 않습니다."),
    USER_FORBIDDEN(HttpStatus.FORBIDDEN, "정지되거나 탈퇴한 계정입니다."),

    REFRESH_TOKEN_NOT_FOUND(HttpStatus.BAD_REQUEST, "refresh token이 존재하지 않습니다."),
    REFRESH_TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "refresh token이 만료되었습니다."),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."),
    NONE_ID(HttpStatus.BAD_REQUEST, "아이디를 입력해주세요.");

    private final HttpStatus status;
    private final String message;
}
