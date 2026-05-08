package com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.request;

import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record RollingPaperUpdateRequest(
        @Size(max = 200) String title,
        @Size(max = 100) String recipientName,
        String imageKey,
        LocalDate targetDate
) {}
