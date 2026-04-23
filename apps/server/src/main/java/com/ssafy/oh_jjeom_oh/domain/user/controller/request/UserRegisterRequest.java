package com.ssafy.oh_jjeom_oh.domain.user.controller.request;

import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Gender;

public record UserRegisterRequest(
        String school,
        Gender gender,
        String grade
) {}
