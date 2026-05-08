package com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class RollingPaperCommentCreateRequest {

    @NotBlank(message = "댓글 내용은 필수입니다.")
    @Size(max = 200, message = "댓글은 200자 이내여야 합니다.")
    private String content;

    private String stickerKey;   // 선택

    @NotNull(message = "슬롯 번호는 필수입니다.")
    private Integer slotIndex;

    @Size(max = 8, message = "닉네임은 8자 이내여야 합니다.")
    private String guestNickname;   // 비회원 필수, 회원은 nickname 자동 사용

    private String guestPassword; // 비회원 필수 (회원은 무시)
}
