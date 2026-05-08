package com.ssafy.oh_jjeom_oh.domain.rollingpaper.service;

import com.ssafy.oh_jjeom_oh.common.exception.CustomException;
import com.ssafy.oh_jjeom_oh.common.exception.ErrorCode;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.request.RollingPaperCreateRequest;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.request.RollingPaperUpdateRequest;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response.RollingPaperCreateResponse;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response.RollingPaperDetailResponse;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response.RollingPaperSavedListResponse;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response.RollingPaperSaveResponse;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response.RollingPaperSummaryResponse;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.entity.RollingPaper;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.repository.RollingPaperCommentRepository;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.repository.RollingPaperRepository;
import com.ssafy.oh_jjeom_oh.domain.share.service.ShareService;
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
@DisplayName("RollingPaperService 단위 테스트")
class RollingPaperServiceTest {

    @InjectMocks RollingPaperService rollingPaperService;
    @Mock RollingPaperRepository rollingPaperRepository;
    @Mock RollingPaperCommentRepository rollingPaperCommentRepository;
    @Mock com.ssafy.oh_jjeom_oh.domain.board.repository.WishBoardRepository wishBoardRepository;
    @Mock UserRepository userRepository;
    @Mock ShareService shareService;

    private User owner;
    private RollingPaper paper;

    static final String SLUG         = "testslug01";
    static final String COMMENT_TOKEN = "commenttoken00000000000000000000";
    static final String VIEW_TOKEN    = "viewtoken000000000000000000000000";

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .username("owner").nickname("오너").passwordHash("h")
                .role(Role.CHILD).status(Status.ACTIVE).build();
        ReflectionTestUtils.setField(owner, "id", 1L);

        paper = RollingPaper.builder()
                .user(owner).slug(SLUG)
                .title("생일 롤링페이퍼").recipientName("홍길동")
                .targetDate(LocalDate.of(2026, 12, 25))
                .commentToken(COMMENT_TOKEN).viewToken(VIEW_TOKEN)
                .build();
        ReflectionTestUtils.setField(paper, "id", 10L);
    }

    // ===================== createRollingPaper =====================

    @Nested
    @DisplayName("createRollingPaper()")
    class Create {

        @Test
        @DisplayName("생성 성공 - slug/commentShareUrl/viewShareUrl 반환")
        void success() {
            given(wishBoardRepository.countByUser_IdAndIsSavedCopyFalse(any())).willReturn(0L);
            given(rollingPaperRepository.countByUser_IdAndIsSavedCopyFalse(any())).willReturn(0L);
            given(userRepository.findById(1L)).willReturn(Optional.of(owner));
            given(rollingPaperRepository.existsBySlug(any())).willReturn(false);
            given(rollingPaperRepository.existsByCommentToken(any())).willReturn(false);
            given(rollingPaperRepository.existsByViewToken(any())).willReturn(false);
            given(rollingPaperRepository.save(any())).willReturn(paper);
            given(shareService.generateRollingPaperShareLink(any(), any(), any()))
                    .willReturn("https://test.com/share/abc123");

            RollingPaperCreateRequest req = new RollingPaperCreateRequest(
                    "생일 롤링페이퍼", "홍길동", null, LocalDate.of(2026, 12, 25));
            RollingPaperCreateResponse res = rollingPaperService.createRollingPaper(1L, req);

            assertThat(res.getSlug()).isNotBlank();
            assertThat(res.getCommentShareUrl()).isNotBlank();
            assertThat(res.getViewShareUrl()).isNotBlank();
            verify(rollingPaperRepository).save(any());
        }

        @Test
        @DisplayName("실패 - 합산 5개 초과")
        void limitExceeded() {
            given(wishBoardRepository.countByUser_IdAndIsSavedCopyFalse(any())).willReturn(3L);
            given(rollingPaperRepository.countByUser_IdAndIsSavedCopyFalse(any())).willReturn(2L);

            assertThatThrownBy(() -> rollingPaperService.createRollingPaper(1L,
                    new RollingPaperCreateRequest("t", "r", null, LocalDate.now())))
                    .isInstanceOf(CustomException.class)
                    .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                            .isEqualTo(ErrorCode.ROLLING_PAPER_LIMIT_EXCEEDED));
        }
    }

    // ===================== getRollingPaper =====================

    @Nested
    @DisplayName("getRollingPaper()")
    class Get {

        @Test
        @DisplayName("소유자 접근 - isOwner=true, canComment/canSave=true, 토큰 포함")
        void ownerAccess() {
            given(rollingPaperRepository.findBySlug(SLUG)).willReturn(Optional.of(paper));

            RollingPaperDetailResponse res = rollingPaperService.getRollingPaper(1L, SLUG, null);

            assertThat(res.isOwner()).isTrue();
            assertThat(res.isCanComment()).isTrue();
            assertThat(res.isCanSave()).isTrue();
            assertThat(res.getCommentToken()).isEqualTo(COMMENT_TOKEN);
            assertThat(res.getViewToken()).isEqualTo(VIEW_TOKEN);
        }

        @Test
        @DisplayName("commentToken 접근 - canComment=true, canSave=false, 토큰 null")
        void commentTokenAccess() {
            given(rollingPaperRepository.findBySlug(SLUG)).willReturn(Optional.of(paper));

            RollingPaperDetailResponse res = rollingPaperService.getRollingPaper(null, SLUG, COMMENT_TOKEN);

            assertThat(res.isOwner()).isFalse();
            assertThat(res.isCanComment()).isTrue();
            assertThat(res.isCanSave()).isFalse();
            assertThat(res.getCommentToken()).isNull();
            assertThat(res.getViewToken()).isNull();
        }

        @Test
        @DisplayName("viewToken 접근 - canComment=false, canSave=true")
        void viewTokenAccess() {
            given(rollingPaperRepository.findBySlug(SLUG)).willReturn(Optional.of(paper));

            RollingPaperDetailResponse res = rollingPaperService.getRollingPaper(null, SLUG, VIEW_TOKEN);

            assertThat(res.isOwner()).isFalse();
            assertThat(res.isCanComment()).isFalse();
            assertThat(res.isCanSave()).isTrue();
        }

        @Test
        @DisplayName("실패 - 유효하지 않은 토큰, 비로그인")
        void forbidden_noToken() {
            given(rollingPaperRepository.findBySlug(SLUG)).willReturn(Optional.of(paper));

            assertThatThrownBy(() -> rollingPaperService.getRollingPaper(null, SLUG, "wrongtoken"))
                    .isInstanceOf(CustomException.class)
                    .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                            .isEqualTo(ErrorCode.ROLLING_PAPER_FORBIDDEN));
        }

        @Test
        @DisplayName("실패 - 존재하지 않는 slug")
        void notFound() {
            given(rollingPaperRepository.findBySlug(any())).willReturn(Optional.empty());

            assertThatThrownBy(() -> rollingPaperService.getRollingPaper(1L, "no-slug", null))
                    .isInstanceOf(CustomException.class)
                    .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                            .isEqualTo(ErrorCode.ROLLING_PAPER_NOT_FOUND));
        }
    }

    // ===================== updateRollingPaper =====================

    @Nested
    @DisplayName("updateRollingPaper()")
    class Update {

        @Test
        @DisplayName("수정 성공 - title 변경 (응답 없음)")
        void success() {
            given(rollingPaperRepository.findBySlug(SLUG)).willReturn(Optional.of(paper));

            rollingPaperService.updateRollingPaper(
                    1L, SLUG, new RollingPaperUpdateRequest("새 제목", null, null, null));

            assertThat(paper.getTitle()).isEqualTo("새 제목");
        }

        @Test
        @DisplayName("실패 - 타인이 수정 시도")
        void forbidden() {
            given(rollingPaperRepository.findBySlug(SLUG)).willReturn(Optional.of(paper));

            assertThatThrownBy(() -> rollingPaperService.updateRollingPaper(
                    99L, SLUG, new RollingPaperUpdateRequest("x", null, null, null)))
                    .isInstanceOf(CustomException.class)
                    .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                            .isEqualTo(ErrorCode.ROLLING_PAPER_FORBIDDEN));
        }
    }

    // ===================== deleteRollingPaper =====================

    @Nested
    @DisplayName("deleteRollingPaper()")
    class Delete {

        @Test
        @DisplayName("삭제 성공 - 댓글 먼저 삭제 후 롤링페이퍼 삭제")
        void success() {
            given(rollingPaperRepository.findBySlug(SLUG)).willReturn(Optional.of(paper));

            rollingPaperService.deleteRollingPaper(1L, SLUG);

            verify(rollingPaperCommentRepository).deleteByRollingPaper(paper);
            verify(rollingPaperRepository).delete(paper);
        }

        @Test
        @DisplayName("실패 - 타인이 삭제 시도")
        void forbidden() {
            given(rollingPaperRepository.findBySlug(SLUG)).willReturn(Optional.of(paper));

            assertThatThrownBy(() -> rollingPaperService.deleteRollingPaper(99L, SLUG))
                    .isInstanceOf(CustomException.class)
                    .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                            .isEqualTo(ErrorCode.ROLLING_PAPER_DELETE_FORBIDDEN));

            verify(rollingPaperRepository, never()).delete(any());
        }
    }

    // ===================== getMyRollingPapers =====================

    @Nested
    @DisplayName("getMyRollingPapers()")
    class GetMyList {

        @Test
        @DisplayName("내 롤링페이퍼 목록 반환 성공")
        void success() {
            given(rollingPaperRepository.findAllByUser_IdAndIsSavedCopyFalseOrderByCreatedAtDesc(1L))
                    .willReturn(List.of(paper));

            List<RollingPaperSummaryResponse> result = rollingPaperService.getMyRollingPapers(1L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getSlug()).isEqualTo(SLUG);
            assertThat(result.get(0).getTitle()).isEqualTo("생일 롤링페이퍼");
        }

        @Test
        @DisplayName("목록 없으면 빈 리스트 반환")
        void empty() {
            given(rollingPaperRepository.findAllByUser_IdAndIsSavedCopyFalseOrderByCreatedAtDesc(1L))
                    .willReturn(List.of());

            assertThat(rollingPaperService.getMyRollingPapers(1L)).isEmpty();
        }
    }

    // ===================== saveRollingPaper =====================

    @Nested
    @DisplayName("saveRollingPaper()")
    class Save {

        private User other;

        @BeforeEach
        void setUpOther() {
            other = User.builder()
                    .username("other").nickname("타인").passwordHash("h")
                    .role(Role.CHILD).status(Status.ACTIVE).build();
            ReflectionTestUtils.setField(other, "id", 2L);
        }

        @Test
        @DisplayName("viewToken 으로 저장 성공 - source=RECEIVED")
        void success_viewToken() {
            given(rollingPaperRepository.findBySlug(SLUG)).willReturn(Optional.of(paper));
            given(userRepository.findById(2L)).willReturn(Optional.of(other));
            given(rollingPaperRepository.existsBySlug(any())).willReturn(false);
            given(rollingPaperCommentRepository.findAllByRollingPaper(paper)).willReturn(List.of());
            given(rollingPaperRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

            RollingPaperSaveResponse result = rollingPaperService.saveRollingPaper(2L, SLUG, VIEW_TOKEN);

            assertThat(result.getSlug()).isNotBlank();
            assertThat(result.getSource()).isEqualTo("RECEIVED");
            verify(rollingPaperRepository).save(any());
        }

        @Test
        @DisplayName("소유자가 저장 성공 - source=CREATED")
        void success_owner() {
            given(rollingPaperRepository.findBySlug(SLUG)).willReturn(Optional.of(paper));
            given(userRepository.findById(1L)).willReturn(Optional.of(owner));
            given(rollingPaperRepository.existsBySlug(any())).willReturn(false);
            given(rollingPaperCommentRepository.findAllByRollingPaper(paper)).willReturn(List.of());
            given(rollingPaperRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

            RollingPaperSaveResponse result = rollingPaperService.saveRollingPaper(1L, SLUG, null);

            assertThat(result.getSlug()).isNotBlank();
            assertThat(result.getSource()).isEqualTo("CREATED");
        }

        @Test
        @DisplayName("commentToken 으로 저장 시도 → 403")
        void fail_commentToken() {
            given(rollingPaperRepository.findBySlug(SLUG)).willReturn(Optional.of(paper));

            assertThatThrownBy(() -> rollingPaperService.saveRollingPaper(2L, SLUG, COMMENT_TOKEN))
                    .isInstanceOf(CustomException.class)
                    .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                            .isEqualTo(ErrorCode.ROLLING_PAPER_SAVE_FORBIDDEN));
        }

        @Test
        @DisplayName("토큰 없이 비소유자 저장 시도 → 403")
        void noToken_forbidden() {
            given(rollingPaperRepository.findBySlug(SLUG)).willReturn(Optional.of(paper));

            assertThatThrownBy(() -> rollingPaperService.saveRollingPaper(2L, SLUG, null))
                    .isInstanceOf(CustomException.class)
                    .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                            .isEqualTo(ErrorCode.ROLLING_PAPER_SAVE_FORBIDDEN));
        }

        @Test
        @DisplayName("잘못된 토큰으로 저장 시도 → 403")
        void wrongToken_forbidden() {
            given(rollingPaperRepository.findBySlug(SLUG)).willReturn(Optional.of(paper));

            assertThatThrownBy(() -> rollingPaperService.saveRollingPaper(2L, SLUG, "invalidtoken"))
                    .isInstanceOf(CustomException.class)
                    .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                            .isEqualTo(ErrorCode.ROLLING_PAPER_SAVE_FORBIDDEN));
        }
    }

    // ===================== getMySavedRollingPapers =====================

    @Nested
    @DisplayName("getMySavedRollingPapers()")
    class GetMySaved {

        @Test
        @DisplayName("저장한 목록 반환 성공")
        void success() {
            RollingPaper copy = RollingPaper.builder()
                    .user(owner).slug("copy-slug-01").title("생일 롤링페이퍼")
                    .recipientName("홍길동").targetDate(LocalDate.of(2026, 12, 25))
                    .isSavedCopy(true).saveSource("RECEIVED").build();

            given(rollingPaperRepository.findAllBySavedByUser_IdAndIsSavedCopyTrueOrderByCreatedAtDesc(2L))
                    .willReturn(List.of(copy));

            RollingPaperSavedListResponse result = rollingPaperService.getMySavedRollingPapers(2L);

            assertThat(result.getSaved()).hasSize(1);
            assertThat(result.getSaved().get(0).getSlug()).isEqualTo("copy-slug-01");
            assertThat(result.getSaved().get(0).getSource()).isEqualTo("RECEIVED");
        }

        @Test
        @DisplayName("저장한 목록 없으면 빈 리스트")
        void empty() {
            given(rollingPaperRepository.findAllBySavedByUser_IdAndIsSavedCopyTrueOrderByCreatedAtDesc(2L))
                    .willReturn(List.of());

            RollingPaperSavedListResponse result = rollingPaperService.getMySavedRollingPapers(2L);
            assertThat(result.getSaved()).isEmpty();
        }
    }
}
