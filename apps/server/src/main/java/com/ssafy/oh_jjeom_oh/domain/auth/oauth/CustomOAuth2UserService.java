package com.ssafy.oh_jjeom_oh.domain.auth.oauth;

import com.ssafy.oh_jjeom_oh.domain.auth.service.NicknameService;
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
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {
    private final UserRepository userRepository;
    private final NicknameService nicknameService;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        KakaoUserInfo userInfo = KakaoUserInfo.ofKakao(oAuth2User.getAttributes());
        User user = userRepository.findByUsername("kakao_" + userInfo.getProviderId())
                .orElseGet(() -> {
                    String randomNickname = nicknameService.generateRandomNickname();
                    if (userRepository.existsByNickname(randomNickname)) {
                        Random localRandom = new Random();
                        randomNickname = randomNickname.substring(0, Math.min(randomNickname.length(), 6))
                                + (localRandom.nextInt(89) + 10);
                    }
                    return userRepository.save(User.builder()
                            .username("kakao_" + userInfo.getProviderId())
                            .passwordHash("OAUTH_USER")
                            .nickname(randomNickname)
                            .email(userInfo.getEmail())
                            .provider(Provider.KAKAO)
                            .providerId(userInfo.getProviderId())
                            .role(Role.CHILD)
                            .status(Status.ACTIVE)
                            .build());
                });
        return new CustomOAuth2User(
                oAuth2User,
                user.getId(),
                user.getEmail(),
                Collections.singleton(new SimpleGrantedAuthority(user.getRole().name()))
        );
    }
}
