package com.ssafy.oh_jjeom_oh.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // ===================== Common =====================
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "필수 항목이 누락되었습니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다."),

    // ===================== Auth =====================
    INVALID_CREDENTIALS(HttpStatus.BAD_REQUEST, "아이디 또는 비밀번호가 올바르지 않습니다."),
    BANNED_ACCOUNT(HttpStatus.FORBIDDEN, "정지되거나 탈퇴한 계정입니다."),
    DUPLICATE_USERNAME(HttpStatus.BAD_REQUEST, "이미 사용 중인 아이디입니다."),
    DUPLICATE_NICKNAME(HttpStatus.BAD_REQUEST, "이미 사용 중인 닉네임입니다."),
    DUPLICATE_EMAIL(HttpStatus.BAD_REQUEST, "이미 사용 중인 이메일입니다."),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다."),
    EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, "토큰이 만료되었습니다."),
    REFRESH_TOKEN_NOT_FOUND(HttpStatus.BAD_REQUEST, "refresh token이 존재하지 않습니다."),
    EXPIRED_REFRESH_TOKEN(HttpStatus.UNAUTHORIZED, "refresh token이 만료되었습니다."),
    INVALID_OTP(HttpStatus.BAD_REQUEST, "인증번호가 올바르지 않습니다."),
    EXPIRED_OTP(HttpStatus.BAD_REQUEST, "인증번호가 만료되었습니다."),
    UNVERIFIED_EMAIL(HttpStatus.BAD_REQUEST, "인증이 완료되지 않은 이메일입니다."),
    EMAIL_NOT_FOUND(HttpStatus.BAD_REQUEST, "등록되지 않은 이메일입니다."),

    // ===================== User =====================
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 사용자입니다."),
    INVALID_PASSWORD(HttpStatus.BAD_REQUEST, "비밀번호가 올바르지 않습니다."),
    SAME_PASSWORD(HttpStatus.BAD_REQUEST, "새 비밀번호는 현재 비밀번호와 달라야 합니다."),

    // ===================== Board =====================
    BOARD_ALREADY_EXISTS(HttpStatus.BAD_REQUEST, "이미 위시보드가 존재합니다."),
    BOARD_NOT_FOUND(HttpStatus.NOT_FOUND, "위시보드가 존재하지 않습니다."),
    BOARD_SLUG_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 위시보드입니다."),
    BOARD_PRIVATE(HttpStatus.FORBIDDEN, "비공개 위시보드입니다."),

    // ===================== Wish Item =====================
    INVALID_SLOT_INDEX(HttpStatus.BAD_REQUEST, "슬롯 번호는 1~3 사이여야 합니다."),
    SLOT_EMPTY(HttpStatus.BAD_REQUEST, "비어있는 슬롯입니다."),
    SLOT_NOT_FOUND(HttpStatus.NOT_FOUND, "해당 슬롯에 아이템이 존재하지 않습니다."),
    LIKE_OWN_BOARD(HttpStatus.FORBIDDEN, "본인의 위시보드에는 공감할 수 없습니다."),

    // ===================== Asset =====================
    INVALID_STICKER_SLOT_INDEX(HttpStatus.BAD_REQUEST, "슬롯 번호는 1~6 사이여야 합니다."),
    BACKGROUND_NOT_FOUND(HttpStatus.NOT_FOUND, "배경이 존재하지 않습니다."),
    STICKER_NOT_FOUND(HttpStatus.NOT_FOUND, "해당 슬롯에 스티커가 존재하지 않습니다."),

    // ===================== Comment =====================
    COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 댓글입니다."),
    COMMENT_FORBIDDEN(HttpStatus.FORBIDDEN, "수정 권한이 없습니다."),
    COMMENT_DELETE_FORBIDDEN(HttpStatus.FORBIDDEN, "삭제 권한이 없습니다."),
    COMMENT_RATE_LIMIT(HttpStatus.TOO_MANY_REQUESTS, "댓글은 10초에 한 번만 작성할 수 있습니다."),
    INAPPROPRIATE_CONTENT(HttpStatus.BAD_REQUEST, "부적절한 내용이 포함되어 있습니다."),

    // ===================== Ranking =====================
    RANKING_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "랭킹 조회 중 오류가 발생했습니다.");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }
}
