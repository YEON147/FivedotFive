package com.ssafy.oh_jjeom_oh.domain.user.controller.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserUpdateRequest(
        String school,

        @NotBlank(message = "닉네임은 필수입니다.")
        @Size(max = 8, message = "닉네임은 최대 8자까지 가능합니다.")
        String nickname,

        String gender,
        String grade
) {}
