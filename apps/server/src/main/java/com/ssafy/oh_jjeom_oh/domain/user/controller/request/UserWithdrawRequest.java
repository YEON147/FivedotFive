package com.ssafy.oh_jjeom_oh.domain.user.controller.request;

import jakarta.validation.constraints.NotBlank;

public record UserWithdrawRequest(
        String password
) {}
