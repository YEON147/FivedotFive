package com.ssafy.oh_jjeom_oh.domain.rollingpaper.service;

import com.ssafy.oh_jjeom_oh.common.exception.CustomException;
import com.ssafy.oh_jjeom_oh.common.exception.ErrorCode;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.request.RollingPaperCommentCreateRequest;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.request.RollingPaperCommentUpdateRequest;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response.RollingPaperCommentCreateResponse;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response.RollingPaperCommentListResponse;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.entity.RollingPaper;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.entity.RollingPaperComment;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.repository.RollingPaperCommentRepository;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.repository.RollingPaperRepository;
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
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
@DisplayName("RollingPaperCommentService 단위 테스트")
class RollingPaperCommentServiceTest {

    @InjectMocks RollingPaperCommentService service;
    @Mock RollingPaperRepository rollingPaperRepository;
    @Mock RollingPaperCommentRepository commentRepository;
    @Mock UserRepository userRepository;
    @Mock BCryptPasswordEncoder passwordEncoder;
    @Mock Clock clock;

    static final String SLUG          = "paper-slug-01";
    static final String COMMENT_TOKEN = "commenttoken00000000000000000000";
    static final String VIEW_TOKEN    = "viewtoken000000000000000000000000";
    static final Long   OWNER_ID      = 1L;
    static final Long   OTHER_ID      = 2L;

    private User owner;
    private User other;
    private RollingPaper paper;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .username("owner").nickname("오너").passwordHash("h")
                .role(Role.CHILD).status(Status.ACTIVE).build();
        ReflectionTestUtils.setField(owner, "id", OWNER_ID);

        other = User.builder()
                .username("other").nickname("타인").passwordHash("h")
                .role(Role.CHILD).status(Status.ACTIVE).build();
        ReflectionTestUtils.setField(other, "id", OTHER_ID);

        paper = RollingPaper.builder()
                .user(owner)
                .slug(SLUG)
                .title("테스트 롤링페이퍼")
                .recipientName("수신자")
                .targetDate(LocalDate.of(2099, 12, 31)) // 미래 → 미공개
                .commentToken(COMMENT_TOKEN)
                .viewToken(VIEW_TOKEN)
                .isSavedCopy(false)
                .build();
        ReflectionTestUtils.setField(paper, "id", 10L);

        // 기본 Clock 설정: 2099-01-01 (targetDate 이전) — lenient: 일부 테스트에선 미사용
        lenient().when(clock.instant()).thenReturn(Instant.parse("2099-01-01T00:00:00Z"));
        lenient().when(clock.getZone()).thenReturn(ZoneId.of("UTC"));
    }

    // ==================== getComments ====================

    @Nested
    @DisplayName("getComments")
    class GetComments {

        @Test
        @DisplayName("소유자 조회 성공")
        void owner_success() {
            given(rollingPaperRepository.findBySlug(SLUG)).willReturn(Optional.of(paper));
            given(commentRepository.findByRollingPaperOrderBySlotIndexAsc(any(), any()))
                    .willReturn(new PageImpl<>(List.of(), PageRequest.of(0, 6), 0));

            RollingPaperCommentListResponse result =
                    service.getComments(SLUG, 0, 6, OWNER_ID, null);

            assertThat(result.getComments()).isEmpty();
        }

        @Test
        @DisplayName("commentToken 으로 조회 성공")
        void commentToken_success() {
            given(rollingPaperRepository.findBySlug(SLUG)).willReturn(Optional.of(paper));
            given(commentRepository.findByRollingPaperOrderBySlotIndexAsc(any(), any()))
                    .willReturn(new PageImpl<>(List.of(), PageRequest.of(0, 6), 0));

            RollingPaperCommentListResponse result =
                    service.getComments(SLUG, 0, 6, null, COMMENT_TOKEN);

            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("viewToken 으로 조회 성공")
        void viewToken_success() {
            given(rollingPaperRepository.findBySlug(SLUG)).willReturn(Optional.of(paper));
            given(commentRepository.findByRollingPaperOrderBySlotIndexAsc(any(), any()))
                    .willReturn(new PageImpl<>(List.of(), PageRequest.of(0, 6), 0));

            RollingPaperCommentListResponse result =
                    service.getComments(SLUG, 0, 6, null, VIEW_TOKEN);

            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("토큰·소유자 없으면 403")
        void noToken_forbidden() {
            given(rollingPaperRepository.findBySlug(SLUG)).willReturn(Optional.of(paper));

            assertThatThrownBy(() -> service.getComments(SLUG, 0, 6, null, null))
                    .isInstanceOf(CustomException.class)
                    .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                            .isEqualTo(ErrorCode.ROLLING_PAPER_FORBIDDEN));
        }
    }

    // ==================== createComment ====================

    @Nested
    @DisplayName("createComment")
    class CreateComment {

        @Test
        @DisplayName("회원(소유자) 댓글 작성 성공")
        void member_owner_success() {
            RollingPaperCommentCreateRequest req = new RollingPaperCommentCreateRequest();
            ReflectionTestUtils.setField(req, "content", "댓글 내용");
            ReflectionTestUtils.setField(req, "slotIndex", 0);

            given(rollingPaperRepository.findBySlug(SLUG)).willReturn(Optional.of(paper));
            given(commentRepository.existsByPaperIdAndSlotIndexNative(10L, 0)).willReturn(false);
            given(userRepository.findById(OWNER_ID)).willReturn(Optional.of(owner));

            RollingPaperComment saved = RollingPaperComment.builder()
                    .rollingPaper(paper).user(owner).isUser(true)
                    .senderName("오너").content("댓글 내용").slotIndex(0).build();
            ReflectionTestUtils.setField(saved, "id", 100L);
            given(commentRepository.saveAndFlush(any())).willReturn(saved);

            RollingPaperCommentCreateResponse result =
                    service.createComment(OWNER_ID, SLUG, null, req);

            assertThat(result.getId()).isEqualTo(100L);
            assertThat(result.getSlotIndex()).isEqualTo(0);
        }

        @Test
        @DisplayName("비회원 commentToken 댓글 작성 성공")
        void guest_commentToken_success() {
            RollingPaperCommentCreateRequest req = new RollingPaperCommentCreateRequest();
            ReflectionTestUtils.setField(req, "content", "비회원 댓글");
            ReflectionTestUtils.setField(req, "slotIndex", 1);
            ReflectionTestUtils.setField(req, "guestNickname", "게스트");
            ReflectionTestUtils.setField(req, "guestPassword", "1234");

            given(rollingPaperRepository.findBySlug(SLUG)).willReturn(Optional.of(paper));
            given(commentRepository.existsByPaperIdAndSlotIndexNative(10L, 1)).willReturn(false);
            given(passwordEncoder.encode("1234")).willReturn("hashed");

            RollingPaperComment saved = RollingPaperComment.builder()
                    .rollingPaper(paper).user(null).isUser(false)
                    .senderName("게스트").content("비회원 댓글").slotIndex(1).guestPassword("hashed").build();
            ReflectionTestUtils.setField(saved, "id", 101L);
            given(commentRepository.saveAndFlush(any())).willReturn(saved);

            RollingPaperCommentCreateResponse result =
                    service.createComment(null, SLUG, COMMENT_TOKEN, req);

            assertThat(result.getId()).isEqualTo(101L);
        }

        @Test
        @DisplayName("토큰 없는 비인증 접근 → 403")
        void noToken_forbidden() {
            given(rollingPaperRepository.findBySlug(SLUG)).willReturn(Optional.of(paper));

            RollingPaperCommentCreateRequest req = new RollingPaperCommentCreateRequest();
            ReflectionTestUtils.setField(req, "content", "댓글");
            ReflectionTestUtils.setField(req, "slotIndex", 0);

            assertThatThrownBy(() -> service.createComment(null, SLUG, null, req))
                    .isInstanceOf(CustomException.class)
                    .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                            .isEqualTo(ErrorCode.ROLLING_PAPER_FORBIDDEN));
        }

        @Test
        @DisplayName("viewToken 만으로 댓글 작성 시 403")
        void viewToken_forbidden() {
            given(rollingPaperRepository.findBySlug(SLUG)).willReturn(Optional.of(paper));

            RollingPaperCommentCreateRequest req = new RollingPaperCommentCreateRequest();
            ReflectionTestUtils.setField(req, "content", "댓글");
            ReflectionTestUtils.setField(req, "slotIndex", 0);

            assertThatThrownBy(() -> service.createComment(null, SLUG, VIEW_TOKEN, req))
                    .isInstanceOf(CustomException.class)
                    .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                            .isEqualTo(ErrorCode.ROLLING_PAPER_FORBIDDEN));
        }

        @Test
        @DisplayName("슬롯 중복 → 409")
        void slotConflict() {
            given(rollingPaperRepository.findBySlug(SLUG)).willReturn(Optional.of(paper));
            given(commentRepository.existsByPaperIdAndSlotIndexNative(10L, 0)).willReturn(true);

            RollingPaperCommentCreateRequest req = new RollingPaperCommentCreateRequest();
            ReflectionTestUtils.setField(req, "content", "댓글");
            ReflectionTestUtils.setField(req, "slotIndex", 0);

            assertThatThrownBy(() -> service.createComment(OWNER_ID, SLUG, null, req))
                    .isInstanceOf(CustomException.class)
                    .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                            .isEqualTo(ErrorCode.COMMENT_SLOT_CONFLICT));
        }

        @Test
        @DisplayName("비회원 guestNickname 누락 → 400")
        void guest_missingGuestNickname() {
            given(rollingPaperRepository.findBySlug(SLUG)).willReturn(Optional.of(paper));
            given(commentRepository.existsByPaperIdAndSlotIndexNative(10L, 0)).willReturn(false);

            RollingPaperCommentCreateRequest req = new RollingPaperCommentCreateRequest();
            ReflectionTestUtils.setField(req, "content", "댓글");
            ReflectionTestUtils.setField(req, "slotIndex", 0);
            ReflectionTestUtils.setField(req, "guestPassword", "1234");
            // guestNickname is null

            assertThatThrownBy(() -> service.createComment(null, SLUG, COMMENT_TOKEN, req))
                    .isInstanceOf(CustomException.class)
                    .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                            .isEqualTo(ErrorCode.RP_COMMENT_SENDER_NAME_REQUIRED));
        }

        @Test
        @DisplayName("비회원 guestPassword 누락 → 400")
        void guest_missingPassword() {
            given(rollingPaperRepository.findBySlug(SLUG)).willReturn(Optional.of(paper));
            given(commentRepository.existsByPaperIdAndSlotIndexNative(10L, 0)).willReturn(false);

            RollingPaperCommentCreateRequest req = new RollingPaperCommentCreateRequest();
            ReflectionTestUtils.setField(req, "content", "댓글");
            ReflectionTestUtils.setField(req, "slotIndex", 0);
            ReflectionTestUtils.setField(req, "guestNickname", "게스트");
            // guestPassword is null

            assertThatThrownBy(() -> service.createComment(null, SLUG, COMMENT_TOKEN, req))
                    .isInstanceOf(CustomException.class)
                    .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                            .isEqualTo(ErrorCode.RP_COMMENT_PASSWORD_REQUIRED));
        }
    }

    // ==================== updateComment ====================

    @Nested
    @DisplayName("updateComment")
    class UpdateComment {

        @Test
        @DisplayName("회원 댓글 수정 성공")
        void member_success() {
            RollingPaperComment comment = RollingPaperComment.builder()
                    .rollingPaper(paper).user(owner).isUser(true)
                    .senderName("오너").content("원래 내용").slotIndex(0).build();
            ReflectionTestUtils.setField(comment, "id", 100L);

            given(commentRepository.findById(100L)).willReturn(Optional.of(comment));

            RollingPaperCommentUpdateRequest req = new RollingPaperCommentUpdateRequest();
            ReflectionTestUtils.setField(req, "content", "수정된 내용");

            service.updateComment(OWNER_ID, SLUG, 100L, req);

            assertThat(comment.getContent()).isEqualTo("수정된 내용");
        }

        @Test
        @DisplayName("타인이 회원 댓글 수정 시도 → 403")
        void member_wrongUser() {
            RollingPaperComment comment = RollingPaperComment.builder()
                    .rollingPaper(paper).user(owner).isUser(true)
                    .senderName("오너").content("원래 내용").slotIndex(0).build();
            ReflectionTestUtils.setField(comment, "id", 100L);

            given(commentRepository.findById(100L)).willReturn(Optional.of(comment));

            RollingPaperCommentUpdateRequest req = new RollingPaperCommentUpdateRequest();
            ReflectionTestUtils.setField(req, "content", "수정 시도");

            assertThatThrownBy(() -> service.updateComment(OTHER_ID, SLUG, 100L, req))
                    .isInstanceOf(CustomException.class)
                    .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                            .isEqualTo(ErrorCode.COMMENT_FORBIDDEN));
        }

        @Test
        @DisplayName("비회원 댓글 올바른 비밀번호로 수정 성공")
        void guest_success() {
            RollingPaperComment comment = RollingPaperComment.builder()
                    .rollingPaper(paper).user(null).isUser(false)
                    .senderName("게스트").content("원래 내용").slotIndex(1).guestPassword("hashed").build();
            ReflectionTestUtils.setField(comment, "id", 101L);

            given(commentRepository.findById(101L)).willReturn(Optional.of(comment));
            given(passwordEncoder.matches("1234", "hashed")).willReturn(true);

            RollingPaperCommentUpdateRequest req = new RollingPaperCommentUpdateRequest();
            ReflectionTestUtils.setField(req, "content", "수정된 내용");
            ReflectionTestUtils.setField(req, "guestPassword", "1234");

            service.updateComment(null, SLUG, 101L, req);

            assertThat(comment.getContent()).isEqualTo("수정된 내용");
        }

        @Test
        @DisplayName("비회원 댓글 틀린 비밀번호 → 403")
        void guest_wrongPassword() {
            RollingPaperComment comment = RollingPaperComment.builder()
                    .rollingPaper(paper).user(null).isUser(false)
                    .senderName("게스트").content("원래 내용").slotIndex(1).guestPassword("hashed").build();
            ReflectionTestUtils.setField(comment, "id", 101L);

            given(commentRepository.findById(101L)).willReturn(Optional.of(comment));
            given(passwordEncoder.matches("wrong", "hashed")).willReturn(false);

            RollingPaperCommentUpdateRequest req = new RollingPaperCommentUpdateRequest();
            ReflectionTestUtils.setField(req, "content", "수정 시도");
            ReflectionTestUtils.setField(req, "guestPassword", "wrong");

            assertThatThrownBy(() -> service.updateComment(null, SLUG, 101L, req))
                    .isInstanceOf(CustomException.class)
                    .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                            .isEqualTo(ErrorCode.RP_COMMENT_WRONG_PASSWORD));
        }
    }

    // ==================== deleteComment ====================

    @Nested
    @DisplayName("deleteComment")
    class DeleteComment {

        @Test
        @DisplayName("회원 댓글 소프트딜리트 성공")
        void member_success() {
            RollingPaperComment comment = RollingPaperComment.builder()
                    .rollingPaper(paper).user(owner).isUser(true)
                    .senderName("오너").content("삭제할 내용").slotIndex(0).build();
            ReflectionTestUtils.setField(comment, "id", 100L);

            given(commentRepository.findById(100L)).willReturn(Optional.of(comment));

            service.deleteComment(OWNER_ID, SLUG, 100L, null);

            assertThat(comment.getContent()).isEqualTo("삭제된 댓글입니다.");
        }

        @Test
        @DisplayName("비회원 댓글 올바른 비밀번호로 삭제 성공")
        void guest_success() {
            RollingPaperComment comment = RollingPaperComment.builder()
                    .rollingPaper(paper).user(null).isUser(false)
                    .senderName("게스트").content("삭제할 내용").slotIndex(1).guestPassword("hashed").build();
            ReflectionTestUtils.setField(comment, "id", 101L);

            given(commentRepository.findById(101L)).willReturn(Optional.of(comment));
            given(passwordEncoder.matches("1234", "hashed")).willReturn(true);

            service.deleteComment(null, SLUG, 101L, "1234");

            assertThat(comment.getContent()).isEqualTo("삭제된 댓글입니다.");
            assertThat(comment.getGuestPassword()).isNull();
        }

        @Test
        @DisplayName("비회원 댓글 틀린 비밀번호 → 403")
        void guest_wrongPassword() {
            RollingPaperComment comment = RollingPaperComment.builder()
                    .rollingPaper(paper).user(null).isUser(false)
                    .senderName("게스트").content("내용").slotIndex(1).guestPassword("hashed").build();
            ReflectionTestUtils.setField(comment, "id", 101L);

            given(commentRepository.findById(101L)).willReturn(Optional.of(comment));
            given(passwordEncoder.matches("bad", "hashed")).willReturn(false);

            assertThatThrownBy(() -> service.deleteComment(null, SLUG, 101L, "bad"))
                    .isInstanceOf(CustomException.class)
                    .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                            .isEqualTo(ErrorCode.RP_COMMENT_WRONG_PASSWORD));
        }
    }
}
