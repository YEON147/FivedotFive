package com.ssafy.oh_jjeom_oh.domain.asset.dto.response;

import com.ssafy.oh_jjeom_oh.domain.asset.entity.Asset;
import lombok.Getter;

@Getter
public class BackgroundItemResponse {

    private final Long id;
    private final String assetKey;
    private final String displayName;

    private BackgroundItemResponse(Long id, String assetKey, String displayName) {
        this.id = id;
        this.assetKey = assetKey;
        this.displayName = displayName;
    }

    public static BackgroundItemResponse of(Asset asset, String displayName) {
        return new BackgroundItemResponse(asset.getId(), asset.getAssetKey(), displayName);
    }
}
