package com.ssafy.oh_jjeom_oh.domain.board.dto.request;

import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record WishBoardUpdateRequest(
        @Size(max = 100) String title,
        Boolean isPublic,
        LocalDate targetDate
) {}
