package com.ssafy.oh_jjeom_oh.domain.board.dto.response;

import com.ssafy.oh_jjeom_oh.domain.asset.entity.BoardAsset;
import lombok.Getter;

@Getter
public class StickerResponse {

    private final Integer slotIndex;
    private final String assetKey;

    private StickerResponse(Integer slotIndex, String assetKey) {
        this.slotIndex = slotIndex;
        this.assetKey = assetKey;
    }

    public static StickerResponse of(BoardAsset asset) {
        return new StickerResponse(asset.getSlotIndex(), asset.getAssetKey());
    }

    public static StickerResponse ofKeySlot(int slotIndex, String assetKey) {
        return new StickerResponse(slotIndex, assetKey);
    }

    public static StickerResponse empty(int slotIndex) {
        return new StickerResponse(slotIndex, null);
    }
}
