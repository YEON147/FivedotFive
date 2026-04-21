package com.ssafy.oh_jjeom_oh.common.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum SuccessMessage {
    LOGIN_SUCCESS("로그인 되었습니다."),
    SIGNUP_SUCCESS("회원가입이 완료되었습니다."),
    CHECK_SUCCESS("조회가 완료되었습니다."),
    AVAILABLE_ID("사용 가능한 아이디입니다."),
    DUPLICATE_ID("이미 사용 중인 아이디입니다."),
    LOGOUT_SUCCESS("로그아웃 되었습니다."),
    REFRESH_SUCCESS("토큰이 재발급되었습니다.");

    private final String message;
}
