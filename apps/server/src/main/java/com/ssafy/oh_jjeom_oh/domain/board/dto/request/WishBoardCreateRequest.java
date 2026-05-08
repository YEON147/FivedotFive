package com.ssafy.oh_jjeom_oh.domain.board.dto.request;

import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record WishBoardCreateRequest(
        @Size(max = 8, message = "위시보드 제목은 최대 8자까지 입력 가능합니다.")
        String title,
        LocalDate targetDate,
        Boolean isPublic,
        Boolean isCommentPublic
) {}
