package com.ssafy.oh_jjeom_oh.domain.auth.oauth;

import com.ssafy.oh_jjeom_oh.domain.user.entity.User;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Provider;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Role;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Status;
import com.ssafy.oh_jjeom_oh.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {
    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        KakaoUserInfo userInfo = KakaoUserInfo.ofKakao(oAuth2User.getAttributes());

        User user = userRepository.findByUsername("kakao_" + userInfo.getProviderId())
                .orElseGet(() -> userRepository.save(User.builder()
                        .username("kakao_" + userInfo.getProviderId())
                        .passwordHash("OAUTH_USER") // 비밀번호 의미 없음
                        .nickname(userInfo.getNickname())
                        .email(userInfo.getEmail())
                        .provider(Provider.KAKAO)
                        .providerId(userInfo.getProviderId())
                        .role(Role.CHILD)
                        .status(Status.ACTIVE)
                        .build()));

//        return new DefaultOAuth2User(
//                Collections.singleton(new SimpleGrantedAuthority(user.getRole().toString())),
//                oAuth2User.getAttributes(),
//                "id"
//        );
        return new CustomOAuth2User(
                oAuth2User,
                user.getId(),
                user.getEmail(),
                Collections.singleton(new SimpleGrantedAuthority(user.getRole().name()))
        );
    }
}
