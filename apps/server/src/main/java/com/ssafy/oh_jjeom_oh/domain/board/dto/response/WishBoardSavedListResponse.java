package com.ssafy.oh_jjeom_oh.domain.board.dto.response;

import lombok.Getter;

import java.util.List;

/** GET /api/boards/me/saved 응답 — { "saved": [...] } 래퍼 */
@Getter
public class WishBoardSavedListResponse {

    private final List<WishBoardSavedItemResponse> saved;

    private WishBoardSavedListResponse(List<WishBoardSavedItemResponse> saved) {
        this.saved = saved;
    }

    public static WishBoardSavedListResponse of(List<WishBoardSavedItemResponse> saved) {
        return new WishBoardSavedListResponse(saved);
    }
}
