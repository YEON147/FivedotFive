package com.ssafy.oh_jjeom_oh.domain.user.controller.request;
import jakarta.validation.constraints.NotBlank;

public record SchoolUpdateRequest(
        @NotBlank(message = "학교명을 입력해주세요.")
        String school
) {}