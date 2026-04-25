package com.ssafy.oh_jjeom_oh.domain.user.controller.request;

import jakarta.validation.constraints.NotBlank;

public record PasswordUpdateRequest(
        @NotBlank(message = "현재 비밀번호는 필수입니다.")
        String currentPassword,

        @NotBlank(message = "새 비밀번호는 필수입니다.")
        String newPassword
) {}
