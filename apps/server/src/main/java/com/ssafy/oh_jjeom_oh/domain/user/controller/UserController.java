package com.ssafy.oh_jjeom_oh.domain.user.controller;

import com.ssafy.oh_jjeom_oh.common.response.ApiResponse;
import com.ssafy.oh_jjeom_oh.common.response.SuccessMessage;
import com.ssafy.oh_jjeom_oh.common.security.UserPrincipal;
import com.ssafy.oh_jjeom_oh.domain.user.dto.response.UserInfoResponse;
import com.ssafy.oh_jjeom_oh.domain.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
