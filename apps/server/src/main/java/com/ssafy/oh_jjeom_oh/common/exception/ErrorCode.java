package com.ssafy.oh_jjeom_oh.common.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum ErrorCode {
    DUPLICATE_ID(HttpStatus.BAD_REQUEST, "이미 사용 중인 아이디입니다."),
    DUPLICATE_EMAIL(HttpStatus.BAD_REQUEST, "이미 사용 중인 이메일입니다."),
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "입력 값이 올바르지 않습니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류가 발생했습니다."),

    LOGIN_FAILED(HttpStatus.BAD_REQUEST, "아이디 또는 비밀번호가 올바르지 않습니다."),
    USER_FORBIDDEN(HttpStatus.FORBIDDEN, "정지되거나 탈퇴한 계정입니다."),

    REFRESH_TOKEN_NOT_FOUND(HttpStatus.BAD_REQUEST, "refresh token이 존재하지 않습니다."),
    REFRESH_TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "refresh token이 만료되었습니다."),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."),
    NONE_ID(HttpStatus.BAD_REQUEST, "아이디를 입력해주세요."),
    NONE_EMAIL(HttpStatus.BAD_REQUEST, "이메일을 입력해주세요."),

    // 위시보드
    BOARD_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 위시보드가 존재합니다."),
    BOARD_NOT_FOUND(HttpStatus.NOT_FOUND, "위시보드를 찾을 수 없습니다."),
    BOARD_SLUG_NOT_FOUND(HttpStatus.NOT_FOUND, "해당 슬러그의 위시보드를 찾을 수 없습니다."),
    BOARD_PRIVATE(HttpStatus.FORBIDDEN, "비공개 위시보드입니다."),

    // 위시 아이템
    INVALID_SLOT_INDEX(HttpStatus.BAD_REQUEST, "슬롯 번호는 1~3 사이여야 합니다."),
    SLOT_NOT_FOUND(HttpStatus.NOT_FOUND, "해당 슬롯에 아이템이 없습니다."),
    SLOT_EMPTY(HttpStatus.NOT_FOUND, "해당 슬롯이 비어 있습니다."),
    LIKE_OWN_BOARD(HttpStatus.FORBIDDEN, "자신의 위시보드에는 공감할 수 없습니다."),

    // 보드 에셋
    ASSET_NOT_FOUND(HttpStatus.NOT_FOUND, "해당 에셋이 존재하지 않습니다."),
    INVALID_STICKER_SLOT_INDEX(HttpStatus.BAD_REQUEST, "스티커 슬롯 번호는 1~6 사이여야 합니다."),

    // 댓글
    COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "댓글을 찾을 수 없습니다."),
    COMMENT_FORBIDDEN(HttpStatus.FORBIDDEN, "본인이 작성한 댓글만 수정/삭제할 수 있습니다."),
    COMMENT_RATE_LIMIT(HttpStatus.TOO_MANY_REQUESTS, "댓글은 10초에 한 번만 작성할 수 있습니다."),
    COMMENT_STICKER_NOT_FOUND(HttpStatus.NOT_FOUND, "해당 댓글에 선물 아이콘이 없습니다.");

    private final HttpStatus status;
    private final String message;
}
