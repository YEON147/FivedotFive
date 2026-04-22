package com.ssafy.oh_jjeom_oh.domain.asset.dto.response;

import lombok.Getter;

import java.util.List;

@Getter
public class GiftIconListResponse {

    private final List<AssetItemResponse> giftIcons;

    private GiftIconListResponse(List<AssetItemResponse> giftIcons) {
        this.giftIcons = giftIcons;
    }

    public static GiftIconListResponse of(List<AssetItemResponse> giftIcons) {
        return new GiftIconListResponse(giftIcons);
    }
}
