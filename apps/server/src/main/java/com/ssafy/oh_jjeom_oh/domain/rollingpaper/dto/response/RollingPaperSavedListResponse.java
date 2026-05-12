package com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response;

import lombok.Getter;

import java.util.List;

/** GET /api/rolling-papers/me/saved 응답 — { "saved": [...] } 래퍼 */
@Getter
public class RollingPaperSavedListResponse {

    private final List<RollingPaperSavedItemResponse> saved;

    private RollingPaperSavedListResponse(List<RollingPaperSavedItemResponse> saved) {
        this.saved = saved;
    }

    public static RollingPaperSavedListResponse of(List<RollingPaperSavedItemResponse> saved) {
        return new RollingPaperSavedListResponse(saved);
    }
}
