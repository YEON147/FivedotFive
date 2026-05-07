package com.ssafy.oh_jjeom_oh.domain.board.service;

import com.ssafy.oh_jjeom_oh.common.exception.CustomException;
import com.ssafy.oh_jjeom_oh.common.exception.ErrorCode;
import com.ssafy.oh_jjeom_oh.common.util.SlugGenerator;
import com.ssafy.oh_jjeom_oh.domain.asset.entity.AssetType;
import com.ssafy.oh_jjeom_oh.domain.asset.entity.BoardAsset;
import com.ssafy.oh_jjeom_oh.domain.asset.repository.BoardAssetRepository;
import com.ssafy.oh_jjeom_oh.domain.board.dto.request.WishBoardCreateRequest;
import com.ssafy.oh_jjeom_oh.domain.board.dto.request.WishBoardUpdateRequest;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.BoardAssetResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishBoardCreateResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishBoardExistsResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishBoardPublicResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishBoardResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishBoardSaveResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishItemResponse;
import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import com.ssafy.oh_jjeom_oh.domain.board.entity.WishItem;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishBoardRepository;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishItemRepository;
import com.ssafy.oh_jjeom_oh.domain.comment.repository.WishCommentRepository;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.repository.RollingPaperRepository;
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

    private static final int MAX_TOTAL_BOARDS = 5;

    private final WishBoardRepository wishBoardRepository;
    private final WishItemRepository wishItemRepository;
    private final BoardAssetRepository boardAssetRepository;
    private final WishCommentRepository wishCommentRepository;
    private final RollingPaperRepository rollingPaperRepository;
    private final UserRepository userRepository;

    // POST /api/boards - 위시보드 생성 (위시보드+롤링페이퍼 합산 최대 5개)
    @Transactional
    public WishBoardCreateResponse createBoard(Long userId, WishBoardCreateRequest request) {
        long boardCount  = wishBoardRepository.countByUser_IdAndIsSavedCopyFalse(userId);
        long paperCount  = rollingPaperRepository.countByUser_IdAndIsSavedCopyFalse(userId);
        if (boardCount + paperCount >= MAX_TOTAL_BOARDS) {
            throw new CustomException(ErrorCode.BOARD_LIMIT_EXCEEDED);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        String slug;
        do {
            slug = SlugGenerator.generate();
        } while (wishBoardRepository.existsByBoardSlug(slug));

        String title = (request != null && request.title() != null && !request.title().isBlank())
                ? request.title() : null;

        WishBoard board = WishBoard.builder()
                .user(user)
                .boardSlug(slug)
                .title(title)
                .build();
        wishBoardRepository.save(board);

        return WishBoardCreateResponse.of(slug);
    }

    /** GET /api/boards/me/exists — 보드 유무만 (없어도 예외 없음) */
    public WishBoardExistsResponse getMyBoardExists(Long userId) {
        return WishBoardExistsResponse.of(wishBoardRepository.existsByUser_Id(userId));
    }

    // GET /api/boards/me - 내 첫 번째 위시보드 단건 조회 (기존 프론트 호환)
    public WishBoardResponse getMyBoard(Long userId) {
        WishBoard board = wishBoardRepository.findFirstByUser_Id(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.BOARD_NOT_FOUND));
        return buildWishBoardResponse(board);
    }

    // GET /api/boards/me/list - 내 위시보드 목록 조회 (다중 보드)
    public List<WishBoardResponse> getMyBoards(Long userId) {
        List<WishBoard> boards = wishBoardRepository.findAllByUser_IdOrderByCreatedAtDesc(userId);
        return boards.stream()
                .map(this::buildWishBoardResponse)
                .collect(Collectors.toList());
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

    // PATCH /api/boards/{slug} - 위시보드 수정 (소유자만)
    @Transactional
    public WishBoardResponse updateBoard(Long userId, String slug, WishBoardUpdateRequest request) {
        WishBoard board = wishBoardRepository.findByBoardSlug(slug)
                .orElseThrow(() -> new CustomException(ErrorCode.BOARD_SLUG_NOT_FOUND));

        if (!board.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.BOARD_FORBIDDEN);
        }

        if (request.title() != null) {
            board.updateTitle(request.title().isBlank() ? null : request.title());
        }
        if (request.isPublic() != null) {
            board.updateIsPublic(request.isPublic());
        }
        if (request.targetDate() != null) {
            board.updateTargetDate(request.targetDate());
        }

        return buildWishBoardResponse(board);
    }

    // DELETE /api/boards/{slug} - 위시보드 삭제 (소유자만, Hard Delete)
    @Transactional
    public void deleteBoard(Long userId, String slug) {
        WishBoard board = wishBoardRepository.findByBoardSlug(slug)
                .orElseThrow(() -> new CustomException(ErrorCode.BOARD_SLUG_NOT_FOUND));

        if (!board.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.BOARD_DELETE_FORBIDDEN);
        }

        wishCommentRepository.deleteByWishBoard(board);
        wishItemRepository.deleteByBoard(board);
        boardAssetRepository.deleteByBoard(board);
        wishBoardRepository.delete(board);
    }

    // POST /api/boards/{slug}/save - 위시보드 독립 복사본 저장 (타인 보드만)
    @Transactional
    public WishBoardSaveResponse saveBoard(Long userId, String slug) {
        WishBoard original = wishBoardRepository.findByBoardSlug(slug)
                .orElseThrow(() -> new CustomException(ErrorCode.BOARD_SLUG_NOT_FOUND));

        if (original.isDeleted() || original.getIsSavedCopy()) {
            throw new CustomException(ErrorCode.BOARD_SLUG_NOT_FOUND);
        }
        if (!original.getIsPublic()) {
            throw new CustomException(ErrorCode.BOARD_PRIVATE);
        }
        if (original.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.BOARD_CANNOT_SAVE_OWN);
        }

        User saver = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        String newSlug;
        do {
            newSlug = SlugGenerator.generate();
        } while (wishBoardRepository.existsByBoardSlug(newSlug));

        WishBoard copy = WishBoard.builder()
                .user(original.getUser())
                .boardSlug(newSlug)
                .title(original.getTitle())
                .isPublic(false)
                .targetDate(original.getTargetDate())
                .isSavedCopy(true)
                .savedByUser(saver)
                .build();
        wishBoardRepository.save(copy);

        for (WishItem item : wishItemRepository.findByBoardOrderBySlotIndex(original)) {
            wishItemRepository.save(WishItem.builder()
                    .board(copy)
                    .slotIndex(item.getSlotIndex())
                    .itemName(item.getItemName())
                    .likeCount(item.getLikeCount())
                    .status(item.getStatus())
                    .build());
        }

        for (BoardAsset asset : boardAssetRepository.findByBoard(original)) {
            boardAssetRepository.save(BoardAsset.builder()
                    .board(copy)
                    .assetType(asset.getAssetType())
                    .assetKey(asset.getAssetKey())
                    .slotIndex(asset.getSlotIndex())
                    .build());
        }

        return WishBoardSaveResponse.of(newSlug);
    }

    // GET /api/boards/me/saved - 내가 저장한 위시보드 복사본 목록 조회
    public List<WishBoardResponse> getMySavedBoards(Long userId) {
        List<WishBoard> boards = wishBoardRepository
                .findAllBySavedByUser_IdAndIsSavedCopyTrueOrderByCreatedAtDesc(userId);
        return boards.stream()
                .map(this::buildWishBoardResponse)
                .collect(Collectors.toList());
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
                board.getTitle(),
                board.getUser().getUsername(),
                board.getUser().getNickname(),
                board.getUser().getTeamTag(),
                board.getTargetDate(),
                board.getCreatedAt(),
                itemResponses,
                assetResponses
        );
    }

    private List<WishItemResponse> buildItemResponses(WishBoard board) {
        List<WishItem> items = wishItemRepository.findByBoardOrderBySlotIndex(board);
        List<BoardAsset> allAssets = boardAssetRepository.findByBoard(board);

        Map<Integer, String> giftIconMap = allAssets.stream()
                .filter(a -> a.getAssetType() == AssetType.GIFT_STICKER)
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

    private List<BoardAssetResponse> buildAssetResponses(WishBoard board) {
        return boardAssetRepository.findByBoard(board).stream()
                .filter(a -> a.getAssetType() != AssetType.GIFT_STICKER)
                .map(BoardAssetResponse::from)
                .collect(Collectors.toList());
    }
}
