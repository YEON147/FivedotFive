package com.ssafy.oh_jjeom_oh.domain.board.service;

import com.ssafy.oh_jjeom_oh.common.exception.CustomException;
import com.ssafy.oh_jjeom_oh.common.exception.ErrorCode;
import com.ssafy.oh_jjeom_oh.domain.asset.entity.BoardAsset;
import com.ssafy.oh_jjeom_oh.domain.asset.repository.BoardAssetRepository;
import com.ssafy.oh_jjeom_oh.domain.board.dto.request.WishBoardUpdateRequest;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishBoardResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.WishBoardSaveResponse;
import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import com.ssafy.oh_jjeom_oh.domain.board.entity.WishItem;
import com.ssafy.oh_jjeom_oh.domain.board.entity.WishItemStatus;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishBoardRepository;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishItemRepository;
import com.ssafy.oh_jjeom_oh.domain.comment.repository.WishCommentRepository;
import com.ssafy.oh_jjeom_oh.domain.user.entity.User;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Role;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Status;
import com.ssafy.oh_jjeom_oh.domain.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("WishBoardService Stage3 단위 테스트")
class WishBoardServiceStage3Test {

    @InjectMocks
    private WishBoardService wishBoardService;

    @Mock private WishBoardRepository wishBoardRepository;
    @Mock private WishItemRepository wishItemRepository;
    @Mock private BoardAssetRepository boardAssetRepository;
    @Mock private WishCommentRepository wishCommentRepository;
    @Mock private UserRepository userRepository;

    private User owner;
    private User other;
    private WishBoard board;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .username("owner").nickname("오너").passwordHash("h")
                .role(Role.CHILD).status(Status.ACTIVE).build();
        ReflectionTestUtils.setField(owner, "id", 1L);

        other = User.builder()
                .username("other").nickname("타인").passwordHash("h")
                .role(Role.CHILD).status(Status.ACTIVE).build();
        ReflectionTestUtils.setField(other, "id", 2L);

        board = WishBoard.builder()
                .user(owner).boardSlug("slug0000ab")
                .isPublic(true).targetDate(LocalDate.of(2026, 12, 25))
                .build();
        ReflectionTestUtils.setField(board, "id", 10L);
    }

    // ===================== updateBoard =====================

    @Nested
    @DisplayName("updateBoard()")
    class UpdateBoard {

        @Test
        @DisplayName("title 단독 수정 성공")
        void updateTitle_success() {
            given(wishBoardRepository.findByBoardSlug("slug0000ab")).willReturn(Optional.of(board));
            given(wishItemRepository.findByBoardOrderBySlotIndex(board)).willReturn(List.of());
            given(boardAssetRepository.findByBoard(board)).willReturn(List.of());

            WishBoardUpdateRequest req = new WishBoardUpdateRequest("새 제목", null, null);
            WishBoardResponse res = wishBoardService.updateBoard(1L, "slug0000ab", req);

            assertThat(res.getTitle()).isEqualTo("새 제목");
        }

        @Test
        @DisplayName("isPublic 단독 수정 성공")
        void updateIsPublic_success() {
            given(wishBoardRepository.findByBoardSlug("slug0000ab")).willReturn(Optional.of(board));
            given(wishItemRepository.findByBoardOrderBySlotIndex(board)).willReturn(List.of());
            given(boardAssetRepository.findByBoard(board)).willReturn(List.of());

            WishBoardUpdateRequest req = new WishBoardUpdateRequest(null, false, null);
            WishBoardResponse res = wishBoardService.updateBoard(1L, "slug0000ab", req);

            assertThat(res.getIsPublic()).isFalse();
        }

        @Test
        @DisplayName("targetDate 단독 수정 성공")
        void updateTargetDate_success() {
            given(wishBoardRepository.findByBoardSlug("slug0000ab")).willReturn(Optional.of(board));
            given(wishItemRepository.findByBoardOrderBySlotIndex(board)).willReturn(List.of());
            given(boardAssetRepository.findByBoard(board)).willReturn(List.of());

            LocalDate newDate = LocalDate.of(2027, 1, 1);
            WishBoardUpdateRequest req = new WishBoardUpdateRequest(null, null, newDate);
            WishBoardResponse res = wishBoardService.updateBoard(1L, "slug0000ab", req);

            assertThat(res.getTargetDate()).isEqualTo(newDate);
        }

        @Test
        @DisplayName("실패 - 보드 없음")
        void updateBoard_notFound() {
            given(wishBoardRepository.findByBoardSlug(any())).willReturn(Optional.empty());

            assertThatThrownBy(() -> wishBoardService.updateBoard(1L, "noexist", new WishBoardUpdateRequest(null, null, null)))
                    .isInstanceOf(CustomException.class)
                    .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                            .isEqualTo(ErrorCode.BOARD_SLUG_NOT_FOUND));
        }

        @Test
        @DisplayName("실패 - 타인이 수정 시도")
        void updateBoard_forbidden() {
            given(wishBoardRepository.findByBoardSlug("slug0000ab")).willReturn(Optional.of(board));

            assertThatThrownBy(() -> wishBoardService.updateBoard(2L, "slug0000ab", new WishBoardUpdateRequest("x", null, null)))
                    .isInstanceOf(CustomException.class)
                    .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                            .isEqualTo(ErrorCode.BOARD_FORBIDDEN));
        }
    }

    // ===================== deleteBoard =====================

    @Nested
    @DisplayName("deleteBoard()")
    class DeleteBoard {

        @Test
        @DisplayName("삭제 성공 - 댓글/아이템/에셋/보드 순서로 삭제")
        void deleteBoard_success() {
            given(wishBoardRepository.findByBoardSlug("slug0000ab")).willReturn(Optional.of(board));

            wishBoardService.deleteBoard(1L, "slug0000ab");

            verify(wishCommentRepository).deleteByWishBoard(board);
            verify(wishItemRepository).deleteByBoard(board);
            verify(boardAssetRepository).deleteByBoard(board);
            verify(wishBoardRepository).delete(board);
        }

        @Test
        @DisplayName("실패 - 보드 없음")
        void deleteBoard_notFound() {
            given(wishBoardRepository.findByBoardSlug(any())).willReturn(Optional.empty());

            assertThatThrownBy(() -> wishBoardService.deleteBoard(1L, "noexist"))
                    .isInstanceOf(CustomException.class)
                    .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                            .isEqualTo(ErrorCode.BOARD_SLUG_NOT_FOUND));
        }

        @Test
        @DisplayName("실패 - 타인이 삭제 시도")
        void deleteBoard_forbidden() {
            given(wishBoardRepository.findByBoardSlug("slug0000ab")).willReturn(Optional.of(board));

            assertThatThrownBy(() -> wishBoardService.deleteBoard(2L, "slug0000ab"))
                    .isInstanceOf(CustomException.class)
                    .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                            .isEqualTo(ErrorCode.BOARD_DELETE_FORBIDDEN));

            verify(wishBoardRepository, never()).delete(any());
        }
    }

    // ===================== saveBoard =====================

    @Nested
    @DisplayName("saveBoard()")
    class SaveBoard {

        @Test
        @DisplayName("저장 성공 - 아이템·에셋 복사 후 새 slug 반환")
        void saveBoard_success() {
            given(wishBoardRepository.findByBoardSlug("slug0000ab")).willReturn(Optional.of(board));
            given(wishBoardRepository.existsByBoardSlug(any())).willReturn(false);
            given(userRepository.findById(2L)).willReturn(Optional.of(other));

            WishItem item = WishItem.builder().board(board).slotIndex(1).itemName("레고").likeCount(2)
                    .status(WishItemStatus.WANTED).build();
            given(wishItemRepository.findByBoardOrderBySlotIndex(board)).willReturn(List.of(item));
            given(boardAssetRepository.findByBoard(board)).willReturn(List.of());

            WishBoard copy = WishBoard.builder().user(owner).boardSlug("newslug123")
                    .isSavedCopy(true).savedByUser(other).build();
            given(wishBoardRepository.save(any())).willReturn(copy);

            WishBoardSaveResponse res = wishBoardService.saveBoard(2L, "slug0000ab");

            assertThat(res.getSlug()).isNotBlank();
            verify(wishBoardRepository).save(any(WishBoard.class));
            verify(wishItemRepository).save(any(WishItem.class));
        }

        @Test
        @DisplayName("실패 - 본인 보드 저장 시도")
        void saveBoard_ownBoard() {
            given(wishBoardRepository.findByBoardSlug("slug0000ab")).willReturn(Optional.of(board));

            assertThatThrownBy(() -> wishBoardService.saveBoard(1L, "slug0000ab"))
                    .isInstanceOf(CustomException.class)
                    .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                            .isEqualTo(ErrorCode.BOARD_CANNOT_SAVE_OWN));
        }

        @Test
        @DisplayName("실패 - 비공개 보드 저장 시도")
        void saveBoard_privateBoard() {
            WishBoard privateBoard = WishBoard.builder()
                    .user(owner).boardSlug("slug0000ab").isPublic(false).build();
            given(wishBoardRepository.findByBoardSlug("slug0000ab")).willReturn(Optional.of(privateBoard));

            assertThatThrownBy(() -> wishBoardService.saveBoard(2L, "slug0000ab"))
                    .isInstanceOf(CustomException.class)
                    .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                            .isEqualTo(ErrorCode.BOARD_PRIVATE));
        }

        @Test
        @DisplayName("실패 - 이미 복사본인 보드 저장 시도")
        void saveBoard_copyBoard() {
            WishBoard copy = WishBoard.builder()
                    .user(owner).boardSlug("slug0000ab").isPublic(true).isSavedCopy(true).build();
            given(wishBoardRepository.findByBoardSlug("slug0000ab")).willReturn(Optional.of(copy));

            assertThatThrownBy(() -> wishBoardService.saveBoard(2L, "slug0000ab"))
                    .isInstanceOf(CustomException.class)
                    .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                            .isEqualTo(ErrorCode.BOARD_SLUG_NOT_FOUND));
        }
    }

    // ===================== getMySavedBoards =====================

    @Nested
    @DisplayName("getMySavedBoards()")
    class GetMySavedBoards {

        @Test
        @DisplayName("저장한 보드 목록 반환 성공")
        void getMySavedBoards_success() {
            WishBoard savedCopy = WishBoard.builder()
                    .user(owner).boardSlug("copy000001").title("복사본")
                    .isSavedCopy(true).savedByUser(other).build();
            given(wishBoardRepository.findAllBySavedByUser_IdAndIsSavedCopyTrueOrderByCreatedAtDesc(2L))
                    .willReturn(List.of(savedCopy));
            given(wishItemRepository.findByBoardOrderBySlotIndex(savedCopy)).willReturn(List.of());
            given(boardAssetRepository.findByBoard(savedCopy)).willReturn(List.of());

            List<WishBoardResponse> result = wishBoardService.getMySavedBoards(2L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getBoardSlug()).isEqualTo("copy000001");
        }

        @Test
        @DisplayName("저장한 보드 없으면 빈 목록 반환")
        void getMySavedBoards_empty() {
            given(wishBoardRepository.findAllBySavedByUser_IdAndIsSavedCopyTrueOrderByCreatedAtDesc(2L))
                    .willReturn(List.of());

            List<WishBoardResponse> result = wishBoardService.getMySavedBoards(2L);

            assertThat(result).isEmpty();
        }
    }
}
