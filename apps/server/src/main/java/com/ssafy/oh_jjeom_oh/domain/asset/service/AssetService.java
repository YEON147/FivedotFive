package com.ssafy.oh_jjeom_oh.domain.asset.service;

import com.ssafy.oh_jjeom_oh.domain.asset.constant.TeamBoardSlug;
import com.ssafy.oh_jjeom_oh.domain.asset.constant.WallpaperDisplayNames;
import com.ssafy.oh_jjeom_oh.domain.asset.dto.response.AssetItemResponse;
import com.ssafy.oh_jjeom_oh.domain.asset.dto.response.BackgroundItemResponse;
import com.ssafy.oh_jjeom_oh.domain.asset.dto.response.BackgroundListResponse;
import com.ssafy.oh_jjeom_oh.domain.asset.dto.response.GiftIconListResponse;
import com.ssafy.oh_jjeom_oh.domain.asset.dto.response.RollingPaperProfileListResponse;
import com.ssafy.oh_jjeom_oh.domain.asset.dto.response.StickerCatalogListResponse;
import com.ssafy.oh_jjeom_oh.domain.asset.dto.response.StickerFolderListResponse;
import com.ssafy.oh_jjeom_oh.domain.asset.dto.response.StickerFolderResponse;
import com.ssafy.oh_jjeom_oh.domain.asset.entity.AssetType;
import com.ssafy.oh_jjeom_oh.domain.asset.repository.AssetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AssetService {

    private final AssetRepository assetRepository;

    public BackgroundListResponse getBackgrounds() {
        return getBackgrounds(null);
    }

    /**
     * 구단 전용 배경: (1) 경로 {@code /baseball/} (2) 파일명 {@code baseball-} 접두
     * (3) DB에 {@code wallpaper-26.png}~{@code wallpaper-34.png} 처럼 올라온 KBO 프리셋(파일명 번호 26~34) —
     * 표시명은 {@link WallpaperDisplayNames} 와 별개로, 키가 위 형태면 구단({@link TeamBoardSlug})에서만 노출합니다.
     *
     * @param boardSlug 내 보드 slug 등 — 없거나 비구단이면 야구 전용 배경 제외
     */
    public BackgroundListResponse getBackgrounds(String boardSlug) {
        List<BackgroundItemResponse> items = assetRepository
                .findByAssetTypeOrderByDisplayOrderAsc(AssetType.BACKGROUND)
                .stream()
                .filter(asset -> includeBackgroundForBoardContext(asset.getAssetKey(), boardSlug))
                .map(asset -> BackgroundItemResponse.of(asset, WallpaperDisplayNames.resolve(asset.getAssetKey())))
                .toList();
        return BackgroundListResponse.of(items);
    }

    private static boolean includeBackgroundForBoardContext(String assetKey, String boardSlug) {
        if (!isTeamOnlyWallpaperAsset(assetKey)) {
            return true;
        }
        return boardSlug != null && !boardSlug.isBlank() && TeamBoardSlug.isTeamBoard(boardSlug);
    }

    /**
     * 구단 전용: {@code .../baseball/...}, 파일명 {@code baseball-} 접두, 또는 레거시 {@code wallpaper-26}~{@code 34} 번호 대역.
     */
    private static boolean isTeamOnlyWallpaperAsset(String assetKey) {
        if (assetKey == null || assetKey.isBlank()) {
            return false;
        }
        String norm = assetKey.replace('\\', '/').trim();
        String lower = norm.toLowerCase();
        if (lower.contains("/baseball/")) {
            return true;
        }
        int slash = lower.lastIndexOf('/');
        String fileName = slash >= 0 ? lower.substring(slash + 1) : lower;
        if (fileName.startsWith("baseball-")) {
            return true;
        }
        return isLegacyKboWallpaperNumberFileName(fileName);
    }

    /**
     * S3/DB에 {@code wallpapers/wallpaper-26.png} 형태로만 등록된 야구단 배경 — 파일명 번호 26~34.
     */
    private static boolean isLegacyKboWallpaperNumberFileName(String fileNameLower) {
        return fileNameLower.matches("wallpaper-(2[6-9]|3[0-4])\\.png");
    }

    public StickerCatalogListResponse getStickers() {
        return getStickers(null);
    }

    /**
     * @param boardSlug 구단 보드면 야구 스티커 포함. {@code null}·공백이면 야구 경로는 제외(전체 탭에 야구 섞지 않음).
     */
    public StickerCatalogListResponse getStickers(String boardSlug) {
        List<AssetItemResponse> items = assetRepository
                .findByAssetTypeOrderByDisplayOrderAsc(AssetType.STICKER)
                .stream()
                .filter(asset -> includeStickerForBoardContext(asset.getAssetKey(), boardSlug))
                .map(AssetItemResponse::of)
                .toList();
        return StickerCatalogListResponse.of(items);
    }

    public StickerFolderListResponse getStickerFolders() {
        List<String> folders = new ArrayList<>(assetRepository.findDistinctStickerFolders());
        folders.removeIf(AssetService::isBaseballFolderId);
        return StickerFolderListResponse.of(folders);
    }

    /**
     * 구단 보드(boardSlug)일 때만 {@code stickers/baseball/…} 계열 폴더({@code baseball/giants} 등)가 목록에 포함됩니다.
     *
     * @param boardSlug 없거나 비어 있으면 야구 관련 폴더는 제외(일반 카탈로그와 동일 취지)
     */
    public StickerFolderListResponse getStickerFolders(String boardSlug) {
        if (boardSlug == null || boardSlug.isBlank()) {
            return getStickerFolders();
        }
        List<String> folders = new ArrayList<>(assetRepository.findDistinctStickerFolders());
        if (TeamBoardSlug.isTeamBoard(boardSlug)) {
            sortStickerFoldersTeamBoardFirst(folders);
        } else {
            folders.removeIf(AssetService::isBaseballFolderId);
        }
        return StickerFolderListResponse.of(folders);
    }

    public StickerFolderResponse getStickersByFolder(String folder) {
        return getStickersByFolder(folder, null);
    }

    /**
     * @param boardSlug 구단 보드가 아니면 {@code baseball}·{@code baseball/…} 폴더는 빈 목록.
     */
    public StickerFolderResponse getStickersByFolder(String folder, String boardSlug) {
        String folderId = normalizeStickerFolderId(folder);
        if (!folderId.isEmpty()
                && isBaseballFolderId(folderId)
                && boardSlug != null
                && !boardSlug.isBlank()
                && !TeamBoardSlug.isTeamBoard(boardSlug)) {
            return StickerFolderResponse.of(folderId, List.of());
        }
        List<AssetItemResponse> items = assetRepository
                .findStickersByFolder(folderId)
                .stream()
                .map(AssetItemResponse::of)
                .toList();
        return StickerFolderResponse.of(folderId, items);
    }

    /**
     * {@code icons/baseball/} 는 제외 — boardSlug 없이 호출할 때의 기본 카탈로그.
     */
    public GiftIconListResponse getGiftIcons() {
        List<AssetItemResponse> items = assetRepository
                .findByAssetTypeOrderByDisplayOrderAsc(AssetType.GIFT_STICKER)
                .stream()
                .filter(asset -> !isBaseballGiftIconPath(asset.getAssetKey()))
                .map(AssetItemResponse::of)
                .toList();
        return GiftIconListResponse.of(items);
    }

    /**
     * 구단 보드면 {@code icons/baseball/} 포함. 없거나 비어 있으면 {@link #getGiftIcons()} 와 동일(야구 제외).
     */
    public GiftIconListResponse getGiftIcons(String boardSlug) {
        if (boardSlug == null || boardSlug.isBlank()) {
            return getGiftIcons();
        }
        List<AssetItemResponse> items = assetRepository
                .findByAssetTypeOrderByDisplayOrderAsc(AssetType.GIFT_STICKER)
                .stream()
                .filter(asset -> TeamBoardSlug.isTeamBoard(boardSlug)
                        || !isBaseballGiftIconPath(asset.getAssetKey()))
                .map(AssetItemResponse::of)
                .toList();
        return GiftIconListResponse.of(items);
    }

    /**
     * 구단 보드: 야구 계열 폴더를 맨 앞에 두고, 그 안에서는 {@code baseball} 루트 → {@code baseball/common} →
     * 나머지 {@code baseball/…} 사전순. 풍선·귀여운 등 일반 폴더는 그 뒤(사전순).
     */
    private static void sortStickerFoldersTeamBoardFirst(List<String> folders) {
        folders.sort((a, b) -> {
            boolean ab = isBaseballFolderId(a);
            boolean bb = isBaseballFolderId(b);
            if (ab != bb) {
                return ab ? -1 : 1;
            }
            if (ab) {
                return compareBaseballFolderIds(a, b);
            }
            return Comparator.<String>naturalOrder().compare(a, b);
        });
    }

    /** 야구 폴더끼리: 루트 {@code baseball} 최상단, 다음 {@code baseball/common}, 이후 팀 등 사전순. */
    private static int compareBaseballFolderIds(String a, String b) {
        int ra = baseballFolderSortRank(a);
        int rb = baseballFolderSortRank(b);
        if (ra != rb) {
            return Integer.compare(ra, rb);
        }
        return Comparator.<String>naturalOrder().compare(a, b);
    }

    /** 낮을수록 탭에서 더 앞(위). */
    private static int baseballFolderSortRank(String folder) {
        if (folder == null || folder.isBlank()) {
            return 99;
        }
        String f = folder.trim().toLowerCase();
        if ("baseball".equals(f)) {
            return 0;
        }
        if ("baseball/common".equals(f)) {
            return 1;
        }
        return 2;
    }

    /**
     * 앞뒤 {@code /}, 연속 {@code /} 제거. {@code /baseball/landers} → {@code baseball/landers}.
     * 그대로 두면 {@code LIKE 'stickers/' || folder || '/%'} 가 {@code stickers//baseball/...} 가 되어 빈 목록이 됨.
     */
    static String normalizeStickerFolderId(String folder) {
        if (folder == null) {
            return "";
        }
        String f = folder.trim();
        while (f.startsWith("/")) {
            f = f.substring(1);
        }
        while (f.endsWith("/") && !f.isEmpty()) {
            f = f.substring(0, f.length() - 1);
        }
        f = f.replaceAll("/+", "/");
        return f.trim();
    }

    /** 스티커 폴더 id: {@code baseball}, {@code baseball/giants} 등 */
    private static boolean isBaseballFolderId(String folder) {
        if (folder == null || folder.isBlank()) {
            return false;
        }
        String f = folder.trim().toLowerCase();
        return "baseball".equals(f) || f.startsWith("baseball/");
    }

    private static boolean isBaseballGiftIconPath(String assetKey) {
        if (assetKey == null || assetKey.isBlank()) {
            return false;
        }
        return assetKey.toLowerCase().startsWith("icons/baseball/");
    }

    public RollingPaperProfileListResponse getRollingPaperProfiles() {
        List<AssetItemResponse> items = assetRepository
                .findByAssetTypeOrderByDisplayOrderAsc(AssetType.ROLLING_PAPER_PROFILE)
                .stream()
                .map(AssetItemResponse::of)
                .toList();
        return RollingPaperProfileListResponse.of(items);
    }

    private static boolean includeStickerForBoardContext(String assetKey, String boardSlug) {
        if (boardSlug == null || boardSlug.isBlank()) {
            return !isBaseballStickerPath(assetKey);
        }
        if (TeamBoardSlug.isTeamBoard(boardSlug)) {
            return true;
        }
        return !isBaseballStickerPath(assetKey);
    }

    private static boolean isBaseballStickerPath(String assetKey) {
        if (assetKey == null || assetKey.isBlank()) {
            return false;
        }
        return assetKey.toLowerCase().startsWith("stickers/baseball/");
    }
}
