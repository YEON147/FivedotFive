package com.ssafy.oh_jjeom_oh.domain.share.service;

import com.ssafy.oh_jjeom_oh.common.exception.CustomException;
import com.ssafy.oh_jjeom_oh.common.exception.ErrorCode;
import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishBoardRepository;
import com.ssafy.oh_jjeom_oh.domain.share.entity.ShareLink;
import com.ssafy.oh_jjeom_oh.domain.share.repository.ShareLinkRepository;
import com.ssafy.oh_jjeom_oh.domain.user.entity.User;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Role;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Status;
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
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("ShareService 단위 테스트")
class ShareServiceTest {

    @InjectMocks ShareService shareService;
    @Mock WishBoardRepository wishBoardRepository;
    @Mock ShareLinkRepository shareLinkRepository;

    private User owner;
    private WishBoard board;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(shareService, "frontendUrl", "https://fivedotfive.co.kr");

        owner = User.builder()
                .username("owner").nickname("오너").passwordHash("h")
                .role(Role.CHILD).status(Status.ACTIVE).build();
        ReflectionTestUtils.setField(owner, "id", 1L);

        board = WishBoard.builder()
                .user(owner).boardSlug("my-board").title("위시보드")
                .targetDate(LocalDate.now().plusDays(30))
                .build();
        ReflectionTestUtils.setField(board, "id", 10L);
    }

    @Nested
    @DisplayName("generateShareLink()")
    class GenerateShareLink {

        @Test
        @DisplayName("성공 - 단축 URL 반환")
        void success() {
            given(wishBoardRepository.findByBoardSlug("my-board")).willReturn(Optional.of(board));
            given(shareLinkRepository.existsByShortCode(any())).willReturn(false);
            given(shareLinkRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

            String url = shareService.generateShareLink(1L, "my-board");

            assertThat(url).startsWith("https://fivedotfive.co.kr/share/");
            verify(shareLinkRepository).save(any(ShareLink.class));
        }

        @Test
        @DisplayName("실패 - 보드 없음")
        void boardNotFound() {
            given(wishBoardRepository.findByBoardSlug(any())).willReturn(Optional.empty());

            assertThatThrownBy(() -> shareService.generateShareLink(1L, "no-board"))
                    .isInstanceOf(CustomException.class)
                    .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                            .isEqualTo(ErrorCode.BOARD_NOT_FOUND));
        }

        @Test
        @DisplayName("실패 - 타인의 보드 공유 시도")
        void forbidden() {
            given(wishBoardRepository.findByBoardSlug("my-board")).willReturn(Optional.of(board));

            assertThatThrownBy(() -> shareService.generateShareLink(99L, "my-board"))
                    .isInstanceOf(CustomException.class)
                    .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                            .isEqualTo(ErrorCode.BOARD_SHARE_FORBIDDEN));
        }
    }

    @Nested
    @DisplayName("resolveShortCode()")
    class ResolveShortCode {

        @Test
        @DisplayName("성공 - 원본 URL 반환")
        void success() {
            ShareLink link = ShareLink.builder()
                    .shortCode("abc1234567")
                    .originalUrl("https://fivedotfive.co.kr/wishlist/my-board?utm_source=user_share&utm_medium=referral&utm_campaign=wishlist_sharing")
                    .build();

            given(shareLinkRepository.findByShortCode("abc1234567")).willReturn(Optional.of(link));

            String result = shareService.resolveShortCode("abc1234567");

            assertThat(result).contains("/wishlist/my-board");
        }

        @Test
        @DisplayName("실패 - 존재하지 않는 코드")
        void notFound() {
            given(shareLinkRepository.findByShortCode(any())).willReturn(Optional.empty());

            assertThatThrownBy(() -> shareService.resolveShortCode("notexist"))
                    .isInstanceOf(CustomException.class)
                    .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                            .isEqualTo(ErrorCode.SHARE_LINK_NOT_FOUND));
        }
    }

    @Nested
    @DisplayName("generateRollingPaperShareLink()")
    class GenerateRollingPaperShareLink {

        @Test
        @DisplayName("성공 - 단축 URL 반환")
        void success() {
            given(shareLinkRepository.existsByShortCode(any())).willReturn(false);
            given(shareLinkRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

            String url = shareService.generateRollingPaperShareLink(
                    "paper-slug", "token123", LocalDate.now().plusDays(10));

            assertThat(url).startsWith("https://fivedotfive.co.kr/share/");
            verify(shareLinkRepository).save(any(ShareLink.class));
        }
    }
}
