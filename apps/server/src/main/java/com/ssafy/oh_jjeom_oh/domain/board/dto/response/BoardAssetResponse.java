package com.ssafy.oh_jjeom_oh.domain.board.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.ssafy.oh_jjeom_oh.domain.asset.entity.AssetType;
import com.ssafy.oh_jjeom_oh.domain.asset.entity.BoardAsset;
import lombok.Getter;

@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BoardAssetResponse {

    private final AssetType assetType;
    private final String assetKey;
    private final Integer slotIndex; // BACKGROUND는 null

    private BoardAssetResponse(AssetType assetType, String assetKey, Integer slotIndex) {
        this.assetType = assetType;
        this.assetKey = assetKey;
        this.slotIndex = slotIndex;
    }

    public static BoardAssetResponse from(BoardAsset asset) {
        return new BoardAssetResponse(
                asset.getAssetType(),
                asset.getAssetKey(),
                asset.getSlotIndex()
        );
    }
}
