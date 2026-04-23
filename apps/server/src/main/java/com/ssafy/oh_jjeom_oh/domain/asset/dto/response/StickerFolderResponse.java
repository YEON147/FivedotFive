package com.ssafy.oh_jjeom_oh.domain.asset.dto.response;

import lombok.Getter;

import java.util.List;

@Getter
public class StickerFolderResponse {

    private final String folder;
    private final List<AssetItemResponse> stickers;

    private StickerFolderResponse(String folder, List<AssetItemResponse> stickers) {
        this.folder = folder;
        this.stickers = stickers;
    }

    public static StickerFolderResponse of(String folder, List<AssetItemResponse> stickers) {
        return new StickerFolderResponse(folder, stickers);
    }
}
