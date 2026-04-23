package com.ssafy.oh_jjeom_oh.domain.user.controller.request;

import jakarta.validation.constraints.NotBlank;

public record GradeUpdateRequest(
        @NotBlank(message = "학년을 입력해주세요.")
        String grade
) {}