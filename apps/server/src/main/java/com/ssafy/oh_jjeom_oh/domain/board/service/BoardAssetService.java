package com.ssafy.oh_jjeom_oh.domain.board.service;

import com.ssafy.oh_jjeom_oh.common.exception.CustomException;
import com.ssafy.oh_jjeom_oh.common.exception.ErrorCode;
import com.ssafy.oh_jjeom_oh.domain.asset.constant.WallpaperDisplayNames;
import com.ssafy.oh_jjeom_oh.domain.asset.entity.AssetType;
import com.ssafy.oh_jjeom_oh.domain.asset.entity.BoardAsset;
import com.ssafy.oh_jjeom_oh.domain.asset.repository.BoardAssetRepository;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.BackgroundResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.StickerListResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.StickerResponse;
import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishBoardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoardAssetService {

    private static final int STICKER_SLOT_COUNT = 6;

    private final WishBoardRepository wishBoardRepository;
    private final BoardAssetRepository boardAssetRepository;

    // ===================== 배경 =====================

    public BackgroundResponse getBackground(String slug, Long userId) {
        WishBoard board = getBoard(slug, userId);
        List<BoardAsset> assets = boardAssetRepository.findByBoardAndAssetType(board, AssetType.BACKGROUND);
        if (assets.isEmpty()) return BackgroundResponse.empty();
        BoardAsset asset = assets.get(0);
        return BackgroundResponse.of(asset, WallpaperDisplayNames.resolve(asset.getAssetKey()));
    }

    @Transactional
    public void updateBackground(String slug, Long userId, String assetKey) {
        WishBoard board = getBoard(slug, userId);
        List<BoardAsset> assets = boardAssetRepository.findByBoardAndAssetType(board, AssetType.BACKGROUND);

        if (assets.isEmpty()) {
            boardAssetRepository.save(BoardAsset.builder()
                    .board(board)
                    .assetType(AssetType.BACKGROUND)
                    .assetKey(assetKey)
                    .build());
        } else {
            assets.get(0).updateAssetKey(assetKey);
        }
    }

    @Transactional
    public void deleteBackground(String slug, Long userId) {
        WishBoard board = getBoard(slug, userId);
        List<BoardAsset> assets = boardAssetRepository.findByBoardAndAssetType(board, AssetType.BACKGROUND);
        if (assets.isEmpty()) {
            throw new CustomException(ErrorCode.ASSET_NOT_FOUND);
        }
        boardAssetRepository.delete(assets.get(0));
    }

    // ===================== 스티커 =====================

    public StickerListResponse getStickers(String slug, Long userId) {
        WishBoard board = getBoard(slug, userId);
        List<BoardAsset> assets = boardAssetRepository.findByBoardAndAssetType(board, AssetType.STICKER);

        Map<Integer, String> stickerMap = assets.stream()
                .collect(Collectors.toMap(BoardAsset::getSlotIndex, BoardAsset::getAssetKey));

        return StickerListResponse.of(buildStickerSlots(stickerMap));
    }

    public StickerResponse getSticker(String slug, Long userId, int slotIndex) {
        validateStickerSlot(slotIndex);
        WishBoard board = getBoard(slug, userId);
        Optional<BoardAsset> asset = boardAssetRepository
                .findByBoardAndAssetTypeAndSlotIndex(board, AssetType.STICKER, slotIndex);
        return asset.map(StickerResponse::of).orElse(StickerResponse.empty(slotIndex));
    }

    @Transactional
    public void updateSticker(String slug, Long userId, int slotIndex, String assetKey) {
        validateStickerSlot(slotIndex);
        WishBoard board = getBoard(slug, userId);
        Optional<BoardAsset> existing = boardAssetRepository
                .findByBoardAndAssetTypeAndSlotIndex(board, AssetType.STICKER, slotIndex);

        if (existing.isEmpty()) {
            boardAssetRepository.save(BoardAsset.builder()
                    .board(board)
                    .assetType(AssetType.STICKER)
                    .assetKey(assetKey)
                    .slotIndex(slotIndex)
                    .build());
        } else {
            existing.get().updateAssetKey(assetKey);
        }
    }

    @Transactional
    public void deleteSticker(String slug, Long userId, int slotIndex) {
        validateStickerSlot(slotIndex);
        WishBoard board = getBoard(slug, userId);
        BoardAsset asset = boardAssetRepository
                .findByBoardAndAssetTypeAndSlotIndex(board, AssetType.STICKER, slotIndex)
                .orElseThrow(() -> new CustomException(ErrorCode.ASSET_NOT_FOUND));
        boardAssetRepository.delete(asset);
    }

    // ===================== private helpers =====================

    private WishBoard getBoard(String slug, Long userId) {
        WishBoard board = wishBoardRepository.findByBoardSlug(slug)
                .orElseThrow(() -> new CustomException(ErrorCode.BOARD_SLUG_NOT_FOUND));
        if (!board.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.BOARD_FORBIDDEN);
        }
        return board;
    }

    private void validateStickerSlot(int slotIndex) {
        if (slotIndex < 1 || slotIndex > STICKER_SLOT_COUNT) {
            throw new CustomException(ErrorCode.INVALID_STICKER_SLOT_INDEX);
        }
    }

    private List<StickerResponse> buildStickerSlots(Map<Integer, String> stickerMap) {
        List<StickerResponse> result = new ArrayList<>();
        for (int slot = 1; slot <= STICKER_SLOT_COUNT; slot++) {
            String key = stickerMap.get(slot);
            result.add(key != null
                    ? StickerResponse.ofKeySlot(slot, key)
                    : StickerResponse.empty(slot));
        }
        return result;
    }
}
