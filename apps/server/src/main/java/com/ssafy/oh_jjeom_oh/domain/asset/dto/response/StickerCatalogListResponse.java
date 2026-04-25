package com.ssafy.oh_jjeom_oh.domain.asset.dto.response;

import lombok.Getter;

import java.util.List;

@Getter
public class StickerCatalogListResponse {

    private final List<AssetItemResponse> stickers;

    private StickerCatalogListResponse(List<AssetItemResponse> stickers) {
        this.stickers = stickers;
    }

    public static StickerCatalogListResponse of(List<AssetItemResponse> stickers) {
        return new StickerCatalogListResponse(stickers);
    }
}
