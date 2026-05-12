package com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record RollingPaperCreateRequest(
        @NotBlank @Size(max = 12, message = "롤링페이퍼 제목은 최대 12자까지 입력 가능합니다.") String title,
        @Size(max = 100) String recipientName,
        String imageKey,
        @NotNull LocalDate targetDate,
        Boolean isCommentPublic
) {}
