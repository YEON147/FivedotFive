package com.ssafy.oh_jjeom_oh.domain.asset.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class AssetSyncResponse {

    private int addedCount;

    public static AssetSyncResponse of(int addedCount) {
        return new AssetSyncResponse(addedCount);
    }
}
