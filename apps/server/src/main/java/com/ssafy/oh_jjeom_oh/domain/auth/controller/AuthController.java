package com.ssafy.oh_jjeom_oh.domain.auth.controller;

import com.ssafy.oh_jjeom_oh.common.exception.CustomException;
import com.ssafy.oh_jjeom_oh.common.exception.ErrorCode;
import com.ssafy.oh_jjeom_oh.domain.auth.controller.request.LoginRequest;
import com.ssafy.oh_jjeom_oh.domain.auth.controller.request.SignupRequest;
import com.ssafy.oh_jjeom_oh.domain.auth.controller.response.TokenResponse;
import com.ssafy.oh_jjeom_oh.domain.auth.service.AuthService;
import com.ssafy.oh_jjeom_oh.common.response.ApiResponse;
import com.ssafy.oh_jjeom_oh.common.response.SuccessMessage;
import com.ssafy.oh_jjeom_oh.domain.auth.service.NicknameService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping({"/api/auth", "/auth"})
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final NicknameService nicknameService;

    @GetMapping("/check/username")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkUsername(
            @RequestParam(required = false) String username) {
        if (username == null || username.isBlank()) {
            throw new CustomException(ErrorCode.NONE_ID);
        }
        if (!username.matches("^[a-zA-Z0-9]+$")) {
            throw new CustomException(ErrorCode.INVALID_ID_FORMAT);
        }
        boolean isDuplicate = authService.isUsernameDuplicate(username);
        if (isDuplicate) {
            throw new CustomException(ErrorCode.DUPLICATE_ID);
        }

        return ResponseEntity.ok()
                .body(ApiResponse.success(
                        SuccessMessage.AVAILABLE_ID,
                        Map.of("available", true)
                ));
    }

    @GetMapping("/check/useremail")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkUseremail(
            @RequestParam(required = false) String useremail) {
        if (useremail == null || useremail.isBlank()) {
            throw new CustomException(ErrorCode.NONE_ID);
        }
        boolean isDuplicate = authService.isEmailDuplicate(useremail);
        if (isDuplicate) {
            throw new CustomException(ErrorCode.DUPLICATE_EMAIL);
        }

        return ResponseEntity.ok()
                .body(ApiResponse.success(
                        SuccessMessage.AVAILABLE_EMAIL,
                        Map.of("available", true)
                ));
    }

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<Map<String, Long>>> signup(@Valid @RequestBody SignupRequest request) {
        Long userId = authService.signup(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(SuccessMessage.SIGNUP_SUCCESS, Map.of("id", userId)));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<TokenResponse>> login(@Valid @RequestBody LoginRequest request,
                                                            HttpServletResponse response) {
        TokenResponse tokenResponse = authService.login(request);

        ResponseCookie cookie = ResponseCookie.from("refreshToken", tokenResponse.getRefreshToken())
                .httpOnly(true)
                .path("/")
                .maxAge(604800)
                .sameSite("None")
                .secure(true) // 추후 https로 처리할예정 인프라에서
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok()
                .body(ApiResponse.success(SuccessMessage.LOGIN_SUCCESS, tokenResponse));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<Map<String, String>>> refresh(
            @CookieValue(value = "refreshToken", required = false) String refreshToken,
            HttpServletResponse response) {

        if (refreshToken == null || refreshToken.isBlank()) {
            throw new CustomException(ErrorCode.REFRESH_TOKEN_NOT_FOUND);
        }

        TokenResponse tokenResponse = authService.refresh(refreshToken);

        ResponseCookie cookie = ResponseCookie.from("refreshToken", tokenResponse.getRefreshToken())
                .httpOnly(true)
                .path("/")
                .maxAge(604800)
                .sameSite("None")
                .secure(true)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok()
                .body(ApiResponse.success(
                        SuccessMessage.REFRESH_SUCCESS,
                        Map.of("accessToken", tokenResponse.getAccessToken())
                ));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @CookieValue(value = "refreshToken", required = false) String refreshToken,
            HttpServletResponse response) {

        if (refreshToken != null) {
            authService.logout(refreshToken);
        }

        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .path("/")
                .maxAge(0)
                .sameSite("None")
                .secure(true) // 추후 https로 처리할예정 인프라에서
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok()
                .body(ApiResponse.success(SuccessMessage.LOGOUT_SUCCESS));
    }

    @GetMapping("/check/nickname")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkNickname(
            @RequestParam(required = false) String nickname) {
        if (nickname == null || nickname.isBlank()) {
            throw new CustomException(ErrorCode.INVALID_NICKNAME);
        }
        if (!nickname.matches("^[a-zA-Z0-9가-힣]+$")) {
            throw new CustomException(ErrorCode.INVALID_NICKNAME_FORMAT);
        }
        boolean isDuplicate = authService.isNicknameDuplicate(nickname);
        if (isDuplicate) {
            throw new CustomException(ErrorCode.DUPLICATE_NICKNAME);
        }

        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.NICKNAME_VALID, Map.of("available", true)));
    }

    @GetMapping("/nickname/random")
    public ResponseEntity<ApiResponse<Map<String, String>>> getRandomNickname() {
        String randomNickname = nicknameService.generateRandomNickname();
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.NICKNAME_CREATED, Map.of("nickname", randomNickname)));
    }

    @PostMapping("/password/reset/otp/request")
    public ResponseEntity<?> requestOtp(@RequestBody Map<String, String> request) {
        authService.sendResetOtp(request.get("email"));
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.OTP_SENT));
    }

    @PostMapping("/password/reset/otp/verify")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
        authService.verifyOtp(request.get("email"), request.get("otp"));
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.OTP_VERIFIED));
    }

    @PostMapping("/password/reset/confirm")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        authService.resetPassword(request.get("email"), request.get("newPassword"));
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.PASSWORD_RESET_SUCCESS));
    }
}
