package com.ssafy.oh_jjeom_oh.domain.asset.dto.response;

import com.ssafy.oh_jjeom_oh.domain.asset.entity.Asset;
import lombok.Getter;

@Getter
public class AssetItemResponse {

    private final Long id;
    private final String assetKey;

    private AssetItemResponse(Long id, String assetKey) {
        this.id = id;
        this.assetKey = assetKey;
    }

    public static AssetItemResponse of(Asset asset) {
        return new AssetItemResponse(asset.getId(), asset.getAssetKey());
    }
}
