package com.ssafy.oh_jjeom_oh.domain.asset.dto.response;

import lombok.Getter;

import java.util.List;

@Getter
public class StickerFolderListResponse {

    private final List<String> folders;

    private StickerFolderListResponse(List<String> folders) {
        this.folders = folders;
    }

    public static StickerFolderListResponse of(List<String> folders) {
        return new StickerFolderListResponse(folders);
    }
}
