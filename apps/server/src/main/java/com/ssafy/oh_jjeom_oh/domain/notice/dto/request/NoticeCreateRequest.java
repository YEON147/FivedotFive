package com.ssafy.oh_jjeom_oh.domain.notice.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
public class NoticeCreateRequest {

    @NotBlank(message = "제목은 필수입니다.")
    private String title;

    private String bannerText;

    private Boolean isPinned = false;

    @NotNull(message = "노출 시작일시는 필수입니다.")
    private LocalDateTime startAt;

    @NotNull(message = "노출 종료일시는 필수입니다.")
    private LocalDateTime endAt;
}
