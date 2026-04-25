package com.ssafy.oh_jjeom_oh.domain.board.dto.response;

import com.ssafy.oh_jjeom_oh.domain.asset.entity.BoardAsset;
import lombok.Getter;

@Getter
public class BackgroundResponse {

    private final String assetKey;
    private final String displayName;

    private BackgroundResponse(String assetKey, String displayName) {
        this.assetKey = assetKey;
        this.displayName = displayName;
    }

    public static BackgroundResponse of(BoardAsset asset, String displayName) {
        return new BackgroundResponse(asset.getAssetKey(), displayName);
    }

    public static BackgroundResponse empty() {
        return new BackgroundResponse(null, null);
    }
}
