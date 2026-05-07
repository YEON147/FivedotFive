package com.ssafy.oh_jjeom_oh.domain.board.service;

import com.ssafy.oh_jjeom_oh.common.exception.CustomException;
import com.ssafy.oh_jjeom_oh.common.exception.ErrorCode;
import com.ssafy.oh_jjeom_oh.domain.asset.entity.AssetType;
import com.ssafy.oh_jjeom_oh.domain.asset.entity.BoardAsset;
import com.ssafy.oh_jjeom_oh.domain.asset.repository.BoardAssetRepository;
import com.ssafy.oh_jjeom_oh.domain.board.dto.request.WishBoardCreateRequest;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishBoardCreateResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishBoardPublicResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishBoardResponse;
import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import com.ssafy.oh_jjeom_oh.domain.board.entity.WishItem;
import com.ssafy.oh_jjeom_oh.domain.board.entity.WishItemStatus;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishBoardRepository;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishItemRepository;
import com.ssafy.oh_jjeom_oh.domain.user.entity.User;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Role;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Status;
import com.ssafy.oh_jjeom_oh.domain.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class WishBoardServiceTest {

    @InjectMocks
    private WishBoardService wishBoardService;

    @Mock private WishBoardRepository wishBoardRepository;
    @Mock private WishItemRepository wishItemRepository;
    @Mock private BoardAssetRepository boardAssetRepository;
    @Mock private com.ssafy.oh_jjeom_oh.domain.comment.repository.WishCommentRepository wishCommentRepository;
    @Mock private com.ssafy.oh_jjeom_oh.domain.rollingpaper.repository.RollingPaperRepository rollingPaperRepository;
    @Mock private UserRepository userRepository;

    private User user;
    private WishBoard board;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .username("testuser")
                .nickname("테스트")
                .passwordHash("hashed")
                .role(Role.CHILD)
                .status(Status.ACTIVE)
                .build();

        board = WishBoard.builder()
                .user(user)
                .boardSlug("abc123def4")
                .isPublic(true)
                .targetDate(LocalDate.of(2026, 5, 5))
                .build();
    }

    // ===================== createBoard =====================

    @Test
    @DisplayName("위시보드 생성 성공 - 합산 0개")
    void createBoard_success() {
        given(wishBoardRepository.countByUser_IdAndIsSavedCopyFalse(any())).willReturn(0L);
        given(rollingPaperRepository.countByUser_IdAndIsSavedCopyFalse(any())).willReturn(0L);
        given(userRepository.findById(any())).willReturn(Optional.of(user));
        given(wishBoardRepository.existsByBoardSlug(any())).willReturn(false);
        given(wishBoardRepository.save(any())).willReturn(board);

        WishBoardCreateResponse response = wishBoardService.createBoard(1L, null);

        assertThat(response.getBoardSlug()).isNotBlank();
        verify(wishBoardRepository).save(any());
    }

    @Test
    @DisplayName("위시보드 생성 성공 - title 포함, 합산 2개")
    void createBoard_withTitle_success() {
        given(wishBoardRepository.countByUser_IdAndIsSavedCopyFalse(any())).willReturn(1L);
        given(rollingPaperRepository.countByUser_IdAndIsSavedCopyFalse(any())).willReturn(1L);
        given(userRepository.findById(any())).willReturn(Optional.of(user));
        given(wishBoardRepository.existsByBoardSlug(any())).willReturn(false);
        given(wishBoardRepository.save(any())).willReturn(board);

        WishBoardCreateRequest request = new WishBoardCreateRequest("내 생일 위시리스트");
        WishBoardCreateResponse response = wishBoardService.createBoard(1L, request);

        assertThat(response.getBoardSlug()).isNotBlank();
        verify(wishBoardRepository).save(any());
    }

    @Test
    @DisplayName("위시보드 생성 실패 - 합산 5개 초과")
    void createBoard_limitExceeded() {
        given(wishBoardRepository.countByUser_IdAndIsSavedCopyFalse(any())).willReturn(3L);
        given(rollingPaperRepository.countByUser_IdAndIsSavedCopyFalse(any())).willReturn(2L);

        assertThatThrownBy(() -> wishBoardService.createBoard(1L, null))
                .isInstanceOf(CustomException.class)
                .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                        .isEqualTo(ErrorCode.BOARD_LIMIT_EXCEEDED));
    }

    // ===================== getMyBoards =====================

    @Test
    @DisplayName("내 위시보드 목록 조회 성공")
    void getMyBoards_success() {
        given(wishBoardRepository.findAllByUser_IdOrderByCreatedAtDesc(any())).willReturn(List.of(board));
        given(wishItemRepository.findByBoardOrderBySlotIndex(any())).willReturn(List.of());
        given(boardAssetRepository.findByBoard(any())).willReturn(buildDefaultAssets());

        List<WishBoardResponse> responses = wishBoardService.getMyBoards(1L);

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getBoardSlug()).isEqualTo("abc123def4");
        assertThat(responses.get(0).getIsPublic()).isTrue();
        assertThat(responses.get(0).getItems()).hasSize(3);
        assertThat(responses.get(0).getAssets()).hasSize(7); // BACKGROUND 1 + STICKER 6
    }

    @Test
    @DisplayName("내 위시보드 목록 조회 성공 - 보드 없음")
    void getMyBoards_empty() {
        given(wishBoardRepository.findAllByUser_IdOrderByCreatedAtDesc(any())).willReturn(List.of());

        List<WishBoardResponse> responses = wishBoardService.getMyBoards(1L);

        assertThat(responses).isEmpty();
    }

    // ===================== getBoardBySlug =====================

    @Test
    @DisplayName("slug로 위시보드 조회 성공")
    void getBoardBySlug_success() {
        given(wishBoardRepository.findByBoardSlug("abc123def4")).willReturn(Optional.of(board));
        given(wishItemRepository.findByBoardOrderBySlotIndex(any())).willReturn(List.of(
                WishItem.builder().board(board).slotIndex(1).itemName("레고").likeCount(5).status(WishItemStatus.WANTED).build()
        ));
        given(boardAssetRepository.findByBoard(any())).willReturn(buildDefaultAssets());

        WishBoardPublicResponse response = wishBoardService.getBoardBySlug("abc123def4");

        assertThat(response.getBoardSlug()).isEqualTo("abc123def4");
        assertThat(response.getUsername()).isEqualTo("testuser");
        assertThat(response.getNickname()).isEqualTo("테스트");
        assertThat(response.getItems()).hasSize(3);
        assertThat(response.getItems().get(0).getItemName()).isEqualTo("레고");
        assertThat(response.getItems().get(1).getItemName()).isNull();
    }

    @Test
    @DisplayName("slug로 위시보드 조회 실패 - 존재하지 않음")
    void getBoardBySlug_notFound() {
        given(wishBoardRepository.findByBoardSlug(any())).willReturn(Optional.empty());

        assertThatThrownBy(() -> wishBoardService.getBoardBySlug("notexist"))
                .isInstanceOf(CustomException.class)
                .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                        .isEqualTo(ErrorCode.BOARD_SLUG_NOT_FOUND));
    }

    @Test
    @DisplayName("slug로 위시보드 조회 실패 - 비공개 보드")
    void getBoardBySlug_private() {
        WishBoard privateBoard = WishBoard.builder()
                .user(user).boardSlug("abc123def4").isPublic(false).build();

        given(wishBoardRepository.findByBoardSlug(any())).willReturn(Optional.of(privateBoard));

        assertThatThrownBy(() -> wishBoardService.getBoardBySlug("abc123def4"))
                .isInstanceOf(CustomException.class)
                .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                        .isEqualTo(ErrorCode.BOARD_PRIVATE));
    }

    // ===== helpers =====

    private List<BoardAsset> buildDefaultAssets() {
        List<BoardAsset> assets = new ArrayList<>();
        assets.add(BoardAsset.builder().board(board).assetType(AssetType.BACKGROUND).assetKey("default/background.png").build());
        for (int i = 1; i <= 6; i++) {
            assets.add(BoardAsset.builder().board(board).assetType(AssetType.STICKER).assetKey("default/sticker.png").slotIndex(i).build());
        }
        for (int i = 1; i <= 3; i++) {
            assets.add(BoardAsset.builder().board(board).assetType(AssetType.GIFT_STICKER).assetKey("default/gift_icon.png").slotIndex(i).build());
        }
        return assets;
    }
}
