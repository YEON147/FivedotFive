package com.ssafy.oh_jjeom_oh.domain.user.controller.request;

import jakarta.validation.constraints.NotBlank;

public record UserWithdrawRequest(
        @NotBlank(message = "비밀번호를 입력해주세요.")
        String password
) {}
