package com.ssafy.oh_jjeom_oh.domain.board.dto.response;

import lombok.Getter;

import java.util.List;

@Getter
public class StickerListResponse {

    private final List<StickerResponse> stickers;

    private StickerListResponse(List<StickerResponse> stickers) {
        this.stickers = stickers;
    }

    public static StickerListResponse of(List<StickerResponse> stickers) {
        return new StickerListResponse(stickers);
    }
}
