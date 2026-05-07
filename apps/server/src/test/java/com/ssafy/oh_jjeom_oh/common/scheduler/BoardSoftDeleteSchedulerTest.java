package com.ssafy.oh_jjeom_oh.common.scheduler;

import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishBoardRepository;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.entity.RollingPaper;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.repository.RollingPaperRepository;
import com.ssafy.oh_jjeom_oh.domain.user.entity.User;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Role;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Status;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
@DisplayName("BoardSoftDeleteScheduler 단위 테스트")
class BoardSoftDeleteSchedulerTest {

    @InjectMocks BoardSoftDeleteScheduler scheduler;
    @Mock WishBoardRepository wishBoardRepository;
    @Mock RollingPaperRepository rollingPaperRepository;
    @Mock Clock clock;

    private User buildUser() {
        User u = User.builder().username("u").nickname("u").passwordHash("h")
                .role(Role.CHILD).status(Status.ACTIVE).build();
        ReflectionTestUtils.setField(u, "id", 1L);
        return u;
    }

    @Test
    @DisplayName("만료된 위시보드·롤링페이퍼 soft-delete 처리")
    void softDeleteExpiredBoards() {
        User user = buildUser();

        WishBoard expiredBoard = WishBoard.builder()
                .user(user).boardSlug("old-board").title("오래된 위시보드")
                .targetDate(LocalDate.of(2025, 1, 1)).build();

        RollingPaper expiredPaper = RollingPaper.builder()
                .user(user).slug("old-paper").title("오래된 롤링페이퍼")
                .recipientName("친구").targetDate(LocalDate.of(2025, 1, 1))
                .commentToken("ct").viewToken("vt").build();

        given(clock.instant()).willReturn(Instant.parse("2026-01-01T00:00:00Z"));
        given(wishBoardRepository.findAllByTargetDateBeforeAndIsSavedCopyFalseAndDeletedAtIsNull(any()))
                .willReturn(List.of(expiredBoard));
        given(rollingPaperRepository.findAllByTargetDateBeforeAndIsSavedCopyFalseAndDeletedAtIsNull(any()))
                .willReturn(List.of(expiredPaper));

        scheduler.softDeleteExpiredBoards();

        assertThat(expiredBoard.isDeleted()).isTrue();
        assertThat(expiredPaper.isDeleted()).isTrue();
    }

    @Test
    @DisplayName("만료된 항목이 없으면 아무것도 처리하지 않음")
    void noExpiredItems() {
        given(clock.instant()).willReturn(Instant.parse("2026-01-01T00:00:00Z"));
        given(wishBoardRepository.findAllByTargetDateBeforeAndIsSavedCopyFalseAndDeletedAtIsNull(any()))
                .willReturn(List.of());
        given(rollingPaperRepository.findAllByTargetDateBeforeAndIsSavedCopyFalseAndDeletedAtIsNull(any()))
                .willReturn(List.of());

        scheduler.softDeleteExpiredBoards();
        // 예외 없이 정상 완료되면 통과
    }
}
