package com.ssafy.oh_jjeom_oh.domain.user.controller;

import com.ssafy.oh_jjeom_oh.common.response.ApiResponse;
import com.ssafy.oh_jjeom_oh.common.response.SuccessMessage;
import com.ssafy.oh_jjeom_oh.common.security.UserPrincipal;
import com.ssafy.oh_jjeom_oh.domain.user.controller.request.*;
import com.ssafy.oh_jjeom_oh.domain.user.dto.response.UserInfoResponse;
import com.ssafy.oh_jjeom_oh.domain.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // GET /api/users/me - 내 정보 조회 (hasWishBoard 포함)
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserInfoResponse>> getMyInfo(
            @AuthenticationPrincipal UserPrincipal principal) {
        UserInfoResponse data = userService.getMyInfo(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.USER_INFO_FOUND, data));
    }

    @PostMapping("/me")
    public ResponseEntity<ApiResponse<Void>> registerMyInfo(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody UserRegisterRequest request) {
        userService.registerMyInfo(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.USER_INFO_REGISTER, null));
    }

    @PatchMapping("/me")
    public ResponseEntity<ApiResponse<Void>> updateMyInfo(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UserUpdateRequest request) {

        userService.updateMyInfo(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.USER_INFO_UPDATED, null));
    }

    @PatchMapping("/me/password")
    public ResponseEntity<Map<String, Long>> updatePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody PasswordUpdateRequest request) {

        Long userId = userService.updatePassword(principal.getId(), request);

        return ResponseEntity.ok(Map.of("id", userId));
    }

    @PatchMapping("/me/school")
    public ResponseEntity<ApiResponse<Void>> updateSchool(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SchoolUpdateRequest request) {

        userService.updateSchool(principal.getId(), request.school());
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.SCHOOL_UPDATED, null));
    }

    @PatchMapping("/me/gender")
    public ResponseEntity<ApiResponse<Void>> updateGender(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody GenderUpdateRequest request) {

        userService.updateGender(principal.getId(), request.gender());
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.GENDER_UPDATED, null));
    }

    @PatchMapping("/me/nickname")
    public ResponseEntity<ApiResponse<Void>> updateNickname(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody NicknameUpdateRequest request) {

        userService.updateNickname(principal.getId(), request.nickname());
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.NICKNAME_UPDATED, null));
    }

    @PatchMapping("/me/grade")
    public ResponseEntity<ApiResponse<Void>> updateGrade(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody GradeUpdateRequest request) {

        userService.updateGrade(principal.getId(), request.grade());
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.GRADE_UPDATED, null));
    }

    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse<Void>> withdraw(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UserWithdrawRequest request) {

        userService.withdraw(principal.getId(), request.password());
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.USER_INFO_DELETED, null));
    }
}
