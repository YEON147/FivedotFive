package com.ssafy.oh_jjeom_oh.domain.asset.dto.response;

import lombok.Getter;

import java.util.List;

@Getter
public class RollingPaperProfileListResponse {

    private final List<AssetItemResponse> profiles;

    private RollingPaperProfileListResponse(List<AssetItemResponse> profiles) {
        this.profiles = profiles;
    }

    public static RollingPaperProfileListResponse of(List<AssetItemResponse> profiles) {
        return new RollingPaperProfileListResponse(profiles);
    }
}
