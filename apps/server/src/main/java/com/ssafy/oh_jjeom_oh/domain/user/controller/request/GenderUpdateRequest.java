package com.ssafy.oh_jjeom_oh.domain.user.controller.request;

import jakarta.validation.constraints.NotBlank;

public record GenderUpdateRequest(
        @NotBlank(message = "성별을 입력해주세요.")
        String gender
) {}