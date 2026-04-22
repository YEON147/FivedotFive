package com.ssafy.oh_jjeom_oh.domain.board.dto.response;

import com.ssafy.oh_jjeom_oh.domain.asset.entity.BoardAsset;
import lombok.Getter;

@Getter
public class BackgroundResponse {

    private final String assetKey;

    private BackgroundResponse(String assetKey) {
        this.assetKey = assetKey;
    }

    public static BackgroundResponse of(BoardAsset asset) {
        return new BackgroundResponse(asset.getAssetKey());
    }

    public static BackgroundResponse empty() {
        return new BackgroundResponse(null);
    }
}
