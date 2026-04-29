package com.ssafy.oh_jjeom_oh.domain.asset.dto.response;

import lombok.Getter;

import java.util.List;

@Getter
public class BackgroundListResponse {

    private final List<BackgroundItemResponse> backgrounds;

    private BackgroundListResponse(List<BackgroundItemResponse> backgrounds) {
        this.backgrounds = backgrounds;
    }

    public static BackgroundListResponse of(List<BackgroundItemResponse> backgrounds) {
        return new BackgroundListResponse(backgrounds);
    }
}
