package com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class RollingPaperCommentVerifyRequest {

    @NotBlank(message = "비밀번호는 필수입니다.")
    private String guestPassword;
}
