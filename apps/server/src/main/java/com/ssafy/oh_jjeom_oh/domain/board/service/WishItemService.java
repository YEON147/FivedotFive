package com.ssafy.oh_jjeom_oh.domain.board.service;

import com.ssafy.oh_jjeom_oh.common.exception.CustomException;
import com.ssafy.oh_jjeom_oh.common.exception.ErrorCode;
import com.ssafy.oh_jjeom_oh.domain.asset.entity.AssetType;
import com.ssafy.oh_jjeom_oh.domain.asset.entity.BoardAsset;
import com.ssafy.oh_jjeom_oh.domain.asset.repository.BoardAssetRepository;
import com.ssafy.oh_jjeom_oh.domain.board.dto.request.WishItemUpdateRequest;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishItemLikeResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishItemListResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishItemResponse;
import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import com.ssafy.oh_jjeom_oh.domain.board.entity.WishItem;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishBoardRepository;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishItemRepository;
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
public class WishItemService {

    private static final String DEFAULT_GIFT_ICON_KEY = "default/gift_icon.png";

    private final WishBoardRepository wishBoardRepository;
    private final WishItemRepository wishItemRepository;
    private final BoardAssetRepository boardAssetRepository;

    // GET /api/boards/{slug}/items - 슬롯 전체 조회
    public WishItemListResponse getItems(String slug, Long userId) {
        WishBoard board = getBoard(slug, userId);
        return WishItemListResponse.of(buildItemResponses(board));
    }

    // PATCH /api/boards/{slug}/items/{slotIndex} - 슬롯 수정 (upsert)
    @Transactional
    public void updateItem(String slug, Long userId, int slotIndex, WishItemUpdateRequest request) {
        validateSlotIndex(slotIndex);

        WishBoard board = getBoard(slug, userId);

        // WishItem upsert
        Optional<WishItem> existing = wishItemRepository.findByBoardAndSlotIndex(board, slotIndex);
        if (existing.isPresent()) {
            existing.get().update(request.getItemName());
        } else {
            WishItem newItem = WishItem.builder()
                    .board(board)
                    .slotIndex(slotIndex)
                    .itemName(request.getItemName())
                    .build();
            wishItemRepository.save(newItem);
        }

        // iconKey가 있으면 GIFT_STICKER 업데이트
        if (request.getIconKey() != null && !request.getIconKey().isBlank()) {
            BoardAsset giftIcon = boardAssetRepository
                    .findByBoardAndAssetTypeAndSlotIndex(board, AssetType.GIFT_STICKER, slotIndex)
                    .orElseGet(() -> createGiftSticker(board, slotIndex));
            giftIcon.updateAssetKey(request.getIconKey());
        }
    }

    // DELETE /api/boards/{slug}/items/{slotIndex} - 슬롯 비우기
    @Transactional
    public void clearItem(String slug, Long userId, int slotIndex) {
        validateSlotIndex(slotIndex);

        WishBoard board = getBoard(slug, userId);

        WishItem item = wishItemRepository.findByBoardAndSlotIndex(board, slotIndex)
                .orElseThrow(() -> new CustomException(ErrorCode.SLOT_NOT_FOUND));

        wishItemRepository.delete(item);

        // GIFT_STICKER를 기본값으로 초기화
        boardAssetRepository.findByBoardAndAssetTypeAndSlotIndex(board, AssetType.GIFT_STICKER, slotIndex)
                .ifPresent(asset -> asset.updateAssetKey(DEFAULT_GIFT_ICON_KEY));
    }

    // POST /api/boards/{slug}/items/{slotIndex}/like - 공감
    @Transactional
    public WishItemLikeResponse likeItem(Long userId, String slug, int slotIndex) {
        validateSlotIndex(slotIndex);

        WishBoard board = wishBoardRepository.findByBoardSlug(slug)
                .orElseThrow(() -> new CustomException(ErrorCode.BOARD_SLUG_NOT_FOUND));

        WishItem item = wishItemRepository.findByBoardAndSlotIndex(board, slotIndex)
                .orElseThrow(() -> new CustomException(ErrorCode.SLOT_EMPTY));

        item.incrementLikeCount();
        return WishItemLikeResponse.of(item.getLikeCount());
    }

    // ===== private helpers =====

    private WishBoard getBoard(String slug, Long userId) {
        WishBoard board = wishBoardRepository.findByBoardSlug(slug)
                .orElseThrow(() -> new CustomException(ErrorCode.BOARD_SLUG_NOT_FOUND));
        if (!board.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.BOARD_FORBIDDEN);
        }
        return board;
    }

    private void validateSlotIndex(int slotIndex) {
        if (slotIndex < 1 || slotIndex > 3) {
            throw new CustomException(ErrorCode.INVALID_SLOT_INDEX);
        }
    }

    private BoardAsset createGiftSticker(WishBoard board, int slotIndex) {
        BoardAsset asset = BoardAsset.builder()
                .board(board)
                .assetType(AssetType.GIFT_STICKER)
                .assetKey(DEFAULT_GIFT_ICON_KEY)
                .slotIndex(slotIndex)
                .build();
        return boardAssetRepository.save(asset);
    }

    private List<WishItemResponse> buildItemResponses(WishBoard board) {
        List<WishItem> items = wishItemRepository.findByBoardOrderBySlotIndex(board);
        List<BoardAsset> assets = boardAssetRepository.findByBoardAndAssetType(board, AssetType.GIFT_STICKER);

        Map<Integer, String> giftIconMap = assets.stream()
                .collect(Collectors.toMap(BoardAsset::getSlotIndex, BoardAsset::getAssetKey));
        Map<Integer, WishItem> itemMap = items.stream()
                .collect(Collectors.toMap(WishItem::getSlotIndex, i -> i));

        List<WishItemResponse> result = new ArrayList<>();
        for (int slot = 1; slot <= 3; slot++) {
            WishItem item = itemMap.get(slot);
            if (item != null) {
                result.add(WishItemResponse.from(item, giftIconMap.get(slot)));
            } else {
                result.add(WishItemResponse.empty(slot));
            }
        }
        return result;
    }
}
