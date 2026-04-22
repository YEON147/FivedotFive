package com.ssafy.oh_jjeom_oh.domain.auth.oauth;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Map;

@Getter
@AllArgsConstructor
public class KakaoUserInfo {
    private String providerId;
    private String nickname;
    private String email;

    public static KakaoUserInfo ofKakao(Map<String, Object> attributes) {
        Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
        Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");

        return new KakaoUserInfo(
                attributes.get("id").toString(),
                (String) profile.get("nickname"),
                (String) kakaoAccount.get("email")
        );
    }
}