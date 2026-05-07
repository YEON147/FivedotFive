package com.ssafy.oh_jjeom_oh.domain.me.service;

import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishBoardRepository;
import com.ssafy.oh_jjeom_oh.domain.me.dto.response.BoardSummaryResponse;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.entity.RollingPaper;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.repository.RollingPaperRepository;
import com.ssafy.oh_jjeom_oh.domain.user.entity.User;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Role;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Status;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
@DisplayName("MeService 단위 테스트")
class MeServiceTest {

    @InjectMocks MeService meService;
    @Mock WishBoardRepository wishBoardRepository;
    @Mock RollingPaperRepository rollingPaperRepository;

    private User user;
    private WishBoard board;
    private RollingPaper paper;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .username("user1").nickname("유저1").passwordHash("h")
                .role(Role.CHILD).status(Status.ACTIVE).build();
        ReflectionTestUtils.setField(user, "id", 1L);

        board = WishBoard.builder()
                .user(user).boardSlug("board-slug").title("위시보드")
                .isPublic(true).targetDate(LocalDate.of(2099, 12, 31)).build();
        ReflectionTestUtils.setField(board, "createdAt", LocalDateTime.of(2026, 1, 1, 0, 0));

        paper = RollingPaper.builder()
                .user(user).slug("paper-slug").title("롤링페이퍼")
                .recipientName("친구").targetDate(LocalDate.of(2099, 12, 31))
                .commentToken("ct").viewToken("vt").build();
        ReflectionTestUtils.setField(paper, "createdAt", LocalDateTime.of(2026, 3, 1, 0, 0));
    }

    @Test
    @DisplayName("통합 목록 조회 - 최신순 정렬 및 type 필드 확인")
    void getBoardsAll_sorted() {
        given(wishBoardRepository.findAllByUser_IdAndIsSavedCopyFalseOrderByCreatedAtDesc(1L))
                .willReturn(List.of(board));
        given(rollingPaperRepository.findAllByUser_IdAndIsSavedCopyFalseOrderByCreatedAtDesc(1L))
                .willReturn(List.of(paper));

        List<BoardSummaryResponse> result = meService.getBoardsAll(1L);

        assertThat(result).hasSize(2);
        // 롤링페이퍼가 더 최신(3월) → 앞에 위치
        assertThat(result.get(0).getType()).isEqualTo("ROLLING_PAPER");
        assertThat(result.get(0).getSlug()).isEqualTo("paper-slug");
        assertThat(result.get(0).getRecipientName()).isEqualTo("친구");
        assertThat(result.get(1).getType()).isEqualTo("WISH_BOARD");
        assertThat(result.get(1).getSlug()).isEqualTo("board-slug");
        assertThat(result.get(1).getIsPublic()).isTrue();
    }

    @Test
    @DisplayName("통합 목록 조회 - 둘 다 없으면 빈 리스트")
    void getBoardsAll_empty() {
        given(wishBoardRepository.findAllByUser_IdAndIsSavedCopyFalseOrderByCreatedAtDesc(1L))
                .willReturn(List.of());
        given(rollingPaperRepository.findAllByUser_IdAndIsSavedCopyFalseOrderByCreatedAtDesc(1L))
                .willReturn(List.of());

        assertThat(meService.getBoardsAll(1L)).isEmpty();
    }

    @Test
    @DisplayName("통합 목록 조회 - 위시보드만 있는 경우")
    void getBoardsAll_onlyWishboard() {
        given(wishBoardRepository.findAllByUser_IdAndIsSavedCopyFalseOrderByCreatedAtDesc(1L))
                .willReturn(List.of(board));
        given(rollingPaperRepository.findAllByUser_IdAndIsSavedCopyFalseOrderByCreatedAtDesc(1L))
                .willReturn(List.of());

        List<BoardSummaryResponse> result = meService.getBoardsAll(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getType()).isEqualTo("WISH_BOARD");
        assertThat(result.get(0).getRecipientName()).isNull();
    }
}
