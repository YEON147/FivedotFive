package com.ssafy.oh_jjeom_oh.domain.auth.oauth;

import com.ssafy.oh_jjeom_oh.domain.auth.jwt.JwtUtil;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Role;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    private final JwtUtil jwtUtil;
    private final RedisTemplate<String, String> redisTemplate;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();
        String username = "kakao_" + oAuth2User.getName();
//        String role = authentication.getAuthorities().iterator().next().getAuthority();
        String role = authentication.getAuthorities().stream()
                .findFirst()
                .map(GrantedAuthority::getAuthority)
                .orElse(Role.CHILD.name());

        String accessToken = jwtUtil.createAccessToken(oAuth2User.getUserId(), username, role);
        String refreshToken = UUID.randomUUID().toString();

        redisTemplate.opsForValue().set("RT:" + refreshToken, username, 604800, TimeUnit.SECONDS);

        ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(604800)
                .sameSite("Lax")
                .domain("fivedotfive.co.kr") // 실서버 무결성을 위해 도메인 명시
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        String targetUrl = UriComponentsBuilder.fromUriString("https://fivedotfive.co.kr/oauth/callback")
                .queryParam("accessToken", accessToken)
                //.queryParam("refreshToken", refreshToken)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}