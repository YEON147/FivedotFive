package com.ssafy.oh_jjeom_oh.domain.asset.controller;

import com.ssafy.oh_jjeom_oh.common.response.ApiResponse;
import com.ssafy.oh_jjeom_oh.common.response.SuccessMessage;
import com.ssafy.oh_jjeom_oh.domain.asset.dto.response.AssetSyncResponse;
import com.ssafy.oh_jjeom_oh.domain.asset.service.AssetSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/assets")
@RequiredArgsConstructor
public class AdminAssetController {

    private final AssetSyncService assetSyncService;

    // POST /api/admin/assets/sync - S3 에셋을 DB에 동기화 (인증된 사용자만)
    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<AssetSyncResponse>> syncAssets() {
        int addedCount = assetSyncService.syncFromS3();
        return ResponseEntity.ok(
                ApiResponse.success(SuccessMessage.ASSET_SYNC_COMPLETED, AssetSyncResponse.of(addedCount))
        );
    }
}
