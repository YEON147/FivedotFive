package com.ssafy.oh_jjeom_oh.domain.board.service;

import com.ssafy.oh_jjeom_oh.common.exception.CustomException;
import com.ssafy.oh_jjeom_oh.common.exception.ErrorCode;
import com.ssafy.oh_jjeom_oh.common.util.SlugGenerator;
import com.ssafy.oh_jjeom_oh.domain.asset.entity.AssetType;
import com.ssafy.oh_jjeom_oh.domain.asset.entity.BoardAsset;
import com.ssafy.oh_jjeom_oh.domain.asset.repository.BoardAssetRepository;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.BoardAssetResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishBoardCreateResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishBoardExistsResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishBoardPublicResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishBoardResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishItemResponse;
import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import com.ssafy.oh_jjeom_oh.domain.board.entity.WishItem;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishBoardRepository;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishItemRepository;
import com.ssafy.oh_jjeom_oh.domain.user.entity.User;
import com.ssafy.oh_jjeom_oh.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WishBoardService {

    private final WishBoardRepository wishBoardRepository;
    private final WishItemRepository wishItemRepository;
    private final BoardAssetRepository boardAssetRepository;
    private final UserRepository userRepository;

    // POST /api/boards - 위시보드 생성 (회원가입 시 자동 or 수동 호출)
    @Transactional
    public WishBoardCreateResponse createBoard(Long userId) {
        if (wishBoardRepository.existsByUser_Id(userId)) {
            throw new CustomException(ErrorCode.BOARD_ALREADY_EXISTS);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 유니크한 slug 생성 (충돌 시 재시도)
        String slug;
        do {
            slug = SlugGenerator.generate();
        } while (wishBoardRepository.existsByBoardSlug(slug));

        WishBoard board = WishBoard.builder()
                .user(user)
                .boardSlug(slug)
                .build();
        wishBoardRepository.save(board);

        return WishBoardCreateResponse.of(slug);
    }

    /** GET /api/boards/me/exists — 보드 유무만 (없어도 예외 없음) */
    public WishBoardExistsResponse getMyBoardExists(Long userId) {
        return WishBoardExistsResponse.of(wishBoardRepository.existsByUser_Id(userId));
    }

    // GET /api/boards/me - 내 위시보드 조회
    public WishBoardResponse getMyBoard(Long userId) {
        WishBoard board = wishBoardRepository.findByUser_Id(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.BOARD_NOT_FOUND));

        return buildWishBoardResponse(board);
    }

    // GET /api/boards/{slug} - slug로 위시보드 조회 (공개 여부 체크)
    public WishBoardPublicResponse getBoardBySlug(String slug) {
        WishBoard board = wishBoardRepository.findByBoardSlug(slug)
                .orElseThrow(() -> new CustomException(ErrorCode.BOARD_SLUG_NOT_FOUND));

        if (!board.getIsPublic()) {
            throw new CustomException(ErrorCode.BOARD_PRIVATE);
        }

        return buildWishBoardPublicResponse(board);
    }

    // PUT /api/admin/boards/{slug}/visibility - 관리자 보드 공개 여부 강제 변경
    @Transactional
    public void updateBoardVisibility(String slug, boolean isPublic) {
        WishBoard board = wishBoardRepository.findByBoardSlug(slug)
                .orElseThrow(() -> new CustomException(ErrorCode.BOARD_SLUG_NOT_FOUND));
        board.updateIsPublic(isPublic);
    }

    // ===== private helpers =====

    private WishBoardResponse buildWishBoardResponse(WishBoard board) {
        List<WishItemResponse> itemResponses = buildItemResponses(board);
        List<BoardAssetResponse> assetResponses = buildAssetResponses(board);
        return WishBoardResponse.of(board, itemResponses, assetResponses);
    }

    private WishBoardPublicResponse buildWishBoardPublicResponse(WishBoard board) {
        List<WishItemResponse> itemResponses = buildItemResponses(board);
        List<BoardAssetResponse> assetResponses = buildAssetResponses(board);
        return WishBoardPublicResponse.of(
                board.getBoardSlug(),
                board.getUser().getUsername(),
                board.getUser().getNickname(),
                board.getUser().getTeamTag(),
                board.getTargetDate(),
                itemResponses,
                assetResponses
        );
    }

    private List<WishItemResponse> buildItemResponses(WishBoard board) {
        List<WishItem> items = wishItemRepository.findByBoardOrderBySlotIndex(board);
        List<BoardAsset> allAssets = boardAssetRepository.findByBoard(board);

        // GIFT_STICKER를 slot_index -> assetKey 맵으로 변환
        Map<Integer, String> giftIconMap = allAssets.stream()
                .filter(a -> a.getAssetType() == AssetType.GIFT_STICKER)
                .collect(Collectors.toMap(BoardAsset::getSlotIndex, BoardAsset::getAssetKey));

        // wish_items를 slot_index로 맵핑
        Map<Integer, WishItem> itemMap = items.stream()
                .collect(Collectors.toMap(WishItem::getSlotIndex, i -> i));

        // 슬롯 1~3 고정 반환 (없으면 빈 슬롯)
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

    private List<BoardAssetResponse> buildAssetResponses(WishBoard board) {
        return boardAssetRepository.findByBoard(board).stream()
                .filter(a -> a.getAssetType() != AssetType.GIFT_STICKER) // GIFT_STICKER는 items.iconKey로 노출
                .map(BoardAssetResponse::from)
                .collect(Collectors.toList());
    }
}
