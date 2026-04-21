package com.ssafy.oh_jjeom_oh.domain.auth.controller.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SignupRequest(
        @NotBlank(message = "필수 항목이 누락되었습니다.")
        @Size(max = 12, message = "아이디는 최대 12자까지 입력 가능합니다.")
        String username,

        @NotBlank(message = "필수 항목이 누락되었습니다.")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,12}$",
                message = "비밀번호는 8~12자, 영문과 숫자를 모두 포함해야 합니다.")
        String password,

        @NotBlank(message = "필수 항목이 누락되었습니다.")
        @Size(max = 8, message = "닉네임은 최대 8자까지 입력 가능합니다.")
        String nickname,

        @Email(message = "이메일 형식이 올바르지 않습니다.")
        String email,

        String school,
        String schoolcode,
        String gender,
        String grade
) {}
