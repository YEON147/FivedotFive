package com.ssafy.oh_jjeom_oh.domain.auth.service;

import com.ssafy.oh_jjeom_oh.common.exception.CustomException;
import com.ssafy.oh_jjeom_oh.common.exception.ErrorCode;
import com.ssafy.oh_jjeom_oh.domain.auth.controller.request.LoginRequest;
import com.ssafy.oh_jjeom_oh.domain.auth.controller.request.SignupRequest;
import com.ssafy.oh_jjeom_oh.domain.auth.controller.response.TokenResponse;
import com.ssafy.oh_jjeom_oh.domain.auth.jwt.JwtUtil;
import com.ssafy.oh_jjeom_oh.domain.user.entity.User;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Gender;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Status;
import com.ssafy.oh_jjeom_oh.domain.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RedisTemplate<String, String> redisTemplate;

    @Value("${jwt.refresh-token-expiration}")
    private long refreshExpiration;

    public TokenResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new CustomException(ErrorCode.LOGIN_FAILED));

        if (Status.BANNED.equals(user.getStatus()) || Status.INACTIVE.equals(user.getStatus())) {
            throw new CustomException(ErrorCode.USER_FORBIDDEN);
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new CustomException(ErrorCode.LOGIN_FAILED);
        }

        return generateTokenResponse(user);
    }

    public TokenResponse refresh(String refreshToken) {
        String username = redisTemplate.opsForValue().get("RT:" + refreshToken);

        if (username == null) {
            throw new CustomException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        redisTemplate.delete("RT:" + refreshToken);
        return generateTokenResponse(user);
    }

    public void logout(String refreshToken) {
        redisTemplate.delete("RT:" + refreshToken);
    }

    public boolean isUsernameDuplicate(String username) {
        return userRepository.existsByUsername(username);
    }

    @Transactional
    public Long signup(SignupRequest request) {
        if (isUsernameDuplicate(request.username())) {
            throw new CustomException(ErrorCode.DUPLICATE_ID);
        }

        User user = User.builder()
                .username(request.username())
                .passwordHash(passwordEncoder.encode(request.password()))
                .nickname(request.nickname())
                .email(request.email())
                .school(request.school())
                .schoolcode(request.schoolcode())
                .gender(Gender.valueOf(request.gender().toUpperCase()))
                .grade(request.grade())
                .build();
        return userRepository.save(user).getId();
    }

    private TokenResponse generateTokenResponse(User user) {
        String accessToken = jwtUtil.createAccessToken(user.getUsername(), String.valueOf(user.getRole()));
        String refreshToken = UUID.randomUUID().toString();

        redisTemplate.opsForValue().set("RT:" + refreshToken, user.getUsername(), refreshExpiration, TimeUnit.SECONDS);

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .username(user.getUsername())
                .build();
    }
}
