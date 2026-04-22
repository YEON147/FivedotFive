package com.ssafy.oh_jjeom_oh.domain.asset.dto.response;

import lombok.Getter;

import java.util.List;

@Getter
public class BackgroundListResponse {

    private final List<AssetItemResponse> backgrounds;

    private BackgroundListResponse(List<AssetItemResponse> backgrounds) {
        this.backgrounds = backgrounds;
    }

    public static BackgroundListResponse of(List<AssetItemResponse> backgrounds) {
        return new BackgroundListResponse(backgrounds);
    }
}
