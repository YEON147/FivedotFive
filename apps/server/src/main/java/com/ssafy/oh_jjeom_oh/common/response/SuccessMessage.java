package com.ssafy.oh_jjeom_oh.common.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum SuccessMessage {
    // 유저
    USER_INFO_FOUND("유저 정보 조회가 완료되었습니다."),

    LOGIN_SUCCESS("로그인 되었습니다."),
    SIGNUP_SUCCESS("회원가입이 완료되었습니다."),
    CHECK_SUCCESS("조회가 완료되었습니다."),
    AVAILABLE_ID("사용 가능한 아이디입니다."),
    DUPLICATE_ID("이미 사용 중인 아이디입니다."),
    AVAILABLE_EMAIL("사용 가능한 이메일입니다."),
    LOGOUT_SUCCESS("로그아웃 되었습니다."),
    REFRESH_SUCCESS("토큰이 재발급되었습니다."),

    // 위시보드
    BOARD_CREATED("위시보드가 생성되었습니다."),
    BOARD_FOUND("위시보드 조회가 완료되었습니다."),
    BOARD_UPDATED("위시보드가 수정되었습니다."),

    // 위시 아이템
    WISH_ITEM_FOUND("위시 아이템 조회가 완료되었습니다."),
    WISH_ITEM_UPDATED("위시 아이템이 수정되었습니다."),
    WISH_ITEM_DELETED("위시 아이템이 삭제되었습니다."),
    WISH_ITEM_LIKED("공감이 반영되었습니다."),

    // 보드 에셋
    BACKGROUND_FOUND("배경 조회가 완료되었습니다."),
    BACKGROUND_UPDATED("배경이 변경되었습니다."),
    BACKGROUND_DELETED("배경이 삭제되었습니다."),
    STICKER_FOUND("스티커 조회가 완료되었습니다."),
    STICKER_UPDATED("스티커가 변경되었습니다."),
    STICKER_DELETED("스티커가 삭제되었습니다.");

    private final String message;
}
