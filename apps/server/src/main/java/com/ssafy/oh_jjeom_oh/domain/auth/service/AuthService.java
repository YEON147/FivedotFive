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
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishBoardRepository;
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
    private final WishBoardRepository wishBoardRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RedisTemplate<String, String> redisTemplate;
    private final EmailService emailService;

    @Value("${jwt.refresh-token-expiration}")
    private long refreshExpiration;

    public TokenResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new CustomException(ErrorCode.LOGIN_FAILED));

        if (Status.BANNED.equals(user.getStatus()) || Status.INACTIVE.equals(user.getStatus()) || Status.DELETED.equals(user.getStatus())) {
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

    public boolean isEmailDuplicate(String email) {
        return userRepository.existsByEmail(email);
    }

    public boolean isNicknameDuplicate(String nickname) {
        return userRepository.existsByNickname(nickname);
    }

    @Transactional
    public Long signup(SignupRequest request) {
        if (isUsernameDuplicate(request.username())) {
            throw new CustomException(ErrorCode.DUPLICATE_ID);
        }
        if (request.email() != null && !request.email().isBlank() && isEmailDuplicate(request.email())) {
            throw new CustomException(ErrorCode.DUPLICATE_EMAIL);
        }
        if (request.nickname() != null && !request.nickname().isBlank() && isNicknameDuplicate(request.nickname())) {
            throw new CustomException(ErrorCode.DUPLICATE_NICKNAME);
        }
        Gender gender = (request.gender() != null && !request.gender().isBlank())
                ? Gender.valueOf(request.gender().toUpperCase())
                : null;
        String school = (request.school() != null && !request.school().isBlank()) ? request.school() : null;
        String schoolcode = (request.schoolcode() != null && !request.schoolcode().isBlank()) ? request.schoolcode() : null;
        String grade = (request.grade() != null && !request.grade().isBlank()) ? request.grade() : null;

        String nicknameValue = (request.nickname() != null && !request.nickname().isBlank())
                ? request.nickname() : null;

        User user = User.builder()
                .username(request.username())
                .passwordHash(passwordEncoder.encode(request.password()))
                .nickname(nicknameValue)
                .email(request.email())
                .school(school)
                .schoolcode(schoolcode)
                .gender(gender)
                .grade(grade)
                .build();
        return userRepository.save(user).getId();
    }

    private TokenResponse generateTokenResponse(User user) {
        String accessToken = jwtUtil.createAccessToken(user.getId(), user.getUsername(), String.valueOf(user.getRole()));
        String refreshToken = UUID.randomUUID().toString();

        redisTemplate.opsForValue().set("RT:" + refreshToken, user.getUsername(), refreshExpiration, TimeUnit.SECONDS);

        boolean hasWishBoard = wishBoardRepository.existsByUser_Id(user.getId());

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .username(user.getUsername())
                .hasWishBoard(hasWishBoard)
                .build();
    }

    public void sendResetOtp(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        String email = user.getEmail();
        if (email == null || email.isBlank()) {
            throw new CustomException(ErrorCode.EMAIL_NOT_FOUND);
        }

        String otp = String.valueOf((int)(Math.random() * 899999) + 100000);

        redisTemplate.opsForValue().set("OTP:" + username, otp, 300, TimeUnit.SECONDS);

        String title = "[오쩜오] 비밀번호 재설정 인증번호입니다.";
        String content = "인증번호는 [" + otp + "] 입니다. 5분 이내에 입력해주세요.";
        emailService.sendEmail(email, title, content);
    }

    public void verifyOtp(String username, String otp) {
        String savedOtp = redisTemplate.opsForValue().get("OTP:" + username);

        if (savedOtp == null) {
            throw new CustomException(ErrorCode.OTP_EXPIRED);
        }
        if (!savedOtp.equals(otp)) {
            throw new CustomException(ErrorCode.INVALID_OTP);
        }

        redisTemplate.opsForValue().set("VERIFIED:" + username, "true", 600, TimeUnit.SECONDS);
        redisTemplate.delete("OTP:" + username);
    }

    @Transactional
    public void resetPassword(String username, String newPassword) {
        String isVerified = redisTemplate.opsForValue().get("VERIFIED:" + username);
        if (isVerified == null) {
            throw new CustomException(ErrorCode.NOT_VERIFIED_EMAIL);
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        user.updatePassword(passwordEncoder.encode(newPassword));

        redisTemplate.delete("VERIFIED:" + username);
    }
}
