package com.ssafy.oh_jjeom_oh.domain.asset.controller;

import com.ssafy.oh_jjeom_oh.common.exception.CustomException;
import com.ssafy.oh_jjeom_oh.common.exception.ErrorCode;
import com.ssafy.oh_jjeom_oh.common.response.ApiResponse;
import com.ssafy.oh_jjeom_oh.common.response.SuccessMessage;
import com.ssafy.oh_jjeom_oh.common.security.UserPrincipal;
import com.ssafy.oh_jjeom_oh.domain.asset.dto.response.AssetSyncResponse;
import com.ssafy.oh_jjeom_oh.domain.asset.service.AssetSyncService;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/assets")
@RequiredArgsConstructor
public class AdminAssetController {

    private final AssetSyncService assetSyncService;

    // POST /api/admin/assets/sync - S3 에셋을 DB에 동기화 (신규 추가만)
    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<AssetSyncResponse>> syncAssets() {
        int addedCount = assetSyncService.syncFromS3();
        return ResponseEntity.ok(
                ApiResponse.success(SuccessMessage.ASSET_SYNC_COMPLETED, AssetSyncResponse.of(addedCount))
        );
    }

    // POST /api/admin/assets/reset-sync - DB 전체 초기화 후 S3 기준 재동기화
    @PostMapping("/reset-sync")
    public ResponseEntity<ApiResponse<AssetSyncResponse>> resetAndSyncAssets() {
        int addedCount = assetSyncService.resetAndSyncFromS3();
        return ResponseEntity.ok(
                ApiResponse.success(SuccessMessage.ASSET_SYNC_COMPLETED, AssetSyncResponse.of(addedCount))
        );
    }
}
