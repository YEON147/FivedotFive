package com.ssafy.oh_jjeom_oh.domain.board.service;

import com.ssafy.oh_jjeom_oh.common.exception.CustomException;
import com.ssafy.oh_jjeom_oh.common.exception.ErrorCode;
import com.ssafy.oh_jjeom_oh.domain.board.dto.request.CommentCreateRequest;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.CommentCreateResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.CommentListResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.CommentResponse;
import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishBoardRepository;
import com.ssafy.oh_jjeom_oh.domain.comment.entity.WishComment;
import com.ssafy.oh_jjeom_oh.domain.comment.repository.WishCommentRepository;
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
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class WishCommentServiceTest {

    static final LocalDateTime REVEAL_AT = LocalDateTime.of(2026, 5, 5, 8, 0);
    static final ZoneId KST = ZoneId.of("Asia/Seoul");

    /** 공개 후 시각 (2026-05-05 09:00 KST) */
    static final Clock CLOCK_AFTER_REVEAL = Clock.fixed(
            REVEAL_AT.plusHours(1).atZone(KST).toInstant(), KST);

    /** 공개 전 시각 (2026-05-04 23:00 KST) */
    static final Clock CLOCK_BEFORE_REVEAL = Clock.fixed(
            REVEAL_AT.minusHours(9).atZone(KST).toInstant(), KST);

    @InjectMocks
    private WishCommentService wishCommentService;

    @Mock private WishBoardRepository wishBoardRepository;
    @Mock private WishCommentRepository wishCommentRepository;
    @Mock private UserRepository userRepository;
    @Mock private BCryptPasswordEncoder passwordEncoder;

    private User sender;
    private WishBoard board;

    @BeforeEach
    void setUp() {
        sender = User.builder()
                .username("testuser")
                .nickname("테스터")
                .passwordHash("hashed")
                .role(Role.CHILD)
                .status(Status.ACTIVE)
                .build();
        ReflectionTestUtils.setField(sender, "id", 1L);

        board = WishBoard.builder()
                .user(sender)
                .boardSlug("abc123def4")
                .isPublic(true)
                .targetDate(LocalDate.of(2026, 5, 5))
                .build();
        ReflectionTestUtils.setField(board, "id", 10L);

        // 기존 테스트가 content 마스킹 영향을 받지 않도록 기본값은 "공개 후"로 설정
        ReflectionTestUtils.setField(wishCommentService, "clock", CLOCK_AFTER_REVEAL);
    }

    // ===================== createComment =====================

    @Test
    @DisplayName("댓글 작성 성공")
    void createComment_success() {
        CommentCreateRequest request = buildRequest("안녕!", "assets/sticker/a.png", 2);

        given(wishBoardRepository.findByBoardSlug("abc123def4")).willReturn(Optional.of(board));
        given(wishCommentRepository.existsByBoardIdAndSlotIndexNative(10L, 2)).willReturn(false);
        given(userRepository.findById(1L)).willReturn(Optional.of(sender));

        WishComment saved = WishComment.builder()
                .wishBoard(board).user(sender).senderName("테스터")
                .isUser(true).content("안녕!").stickerKey("assets/sticker/a.png").slotIndex(2)
                .build();
        ReflectionTestUtils.setField(saved, "id", 100L);
        given(wishCommentRepository.saveAndFlush(any())).willReturn(saved);

        CommentCreateResponse response = wishCommentService.createComment(1L, "abc123def4", request);

        assertThat(response.getId()).isEqualTo(100L);
        assertThat(response.getSlotIndex()).isEqualTo(2);
    }

    @Test
    @DisplayName("댓글 작성 실패 - 비공개 보드")
    void createComment_privateBoard() {
        WishBoard privateBoard = WishBoard.builder()
                .user(sender).boardSlug("abc123def4").isPublic(false)
                .targetDate(LocalDate.of(2026, 5, 5)).build();
        ReflectionTestUtils.setField(privateBoard, "id", 10L);

        given(wishBoardRepository.findByBoardSlug("abc123def4")).willReturn(Optional.of(privateBoard));

        assertThatThrownBy(() ->
                wishCommentService.createComment(1L, "abc123def4", buildRequest("내용", null, 0)))
                .isInstanceOf(CustomException.class)
                .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                        .isEqualTo(ErrorCode.BOARD_PRIVATE));
    }

    @Test
    @DisplayName("댓글 작성 실패 - 슬롯 중복 (소프트 딜리트된 댓글 포함)")
    void createComment_slotConflict() {
        given(wishBoardRepository.findByBoardSlug("abc123def4")).willReturn(Optional.of(board));
        given(wishCommentRepository.existsByBoardIdAndSlotIndexNative(10L, 3)).willReturn(true);

        assertThatThrownBy(() ->
                wishCommentService.createComment(1L, "abc123def4", buildRequest("내용", null, 3)))
                .isInstanceOf(CustomException.class)
                .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                        .isEqualTo(ErrorCode.COMMENT_SLOT_CONFLICT));
    }

    @Test
    @DisplayName("댓글 작성 실패 - 동시 요청으로 DB Unique 제약 위반 시 409 반환")
    void createComment_concurrentSlotConflict() {
        given(wishBoardRepository.findByBoardSlug("abc123def4")).willReturn(Optional.of(board));
        given(wishCommentRepository.existsByBoardIdAndSlotIndexNative(10L, 1)).willReturn(false);
        given(userRepository.findById(1L)).willReturn(Optional.of(sender));
        given(wishCommentRepository.saveAndFlush(any()))
                .willThrow(new DataIntegrityViolationException("uk_wish_comments_board_slot"));

        assertThatThrownBy(() ->
                wishCommentService.createComment(1L, "abc123def4", buildRequest("내용", null, 1)))
                .isInstanceOf(CustomException.class)
                .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                        .isEqualTo(ErrorCode.COMMENT_SLOT_CONFLICT));
    }

    @Test
    @DisplayName("댓글 작성 실패 - 10초 레이트 리밋")
    void createComment_rateLimitExceeded() {
        CommentCreateRequest request = buildRequest("첫 댓글", null, 0);

        given(wishBoardRepository.findByBoardSlug("abc123def4")).willReturn(Optional.of(board));
        given(wishCommentRepository.existsByBoardIdAndSlotIndexNative(10L, 0)).willReturn(false);
        given(userRepository.findById(1L)).willReturn(Optional.of(sender));

        WishComment saved = WishComment.builder()
                .wishBoard(board).user(sender).senderName("테스터")
                .isUser(true).content("첫 댓글").slotIndex(0).build();
        ReflectionTestUtils.setField(saved, "id", 1L);
        given(wishCommentRepository.saveAndFlush(any())).willReturn(saved);

        wishCommentService.createComment(1L, "abc123def4", request);

        CommentCreateRequest request2 = buildRequest("두 번째 댓글", null, 1);

        assertThatThrownBy(() ->
                wishCommentService.createComment(1L, "abc123def4", request2))
                .isInstanceOf(CustomException.class)
                .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                        .isEqualTo(ErrorCode.COMMENT_RATE_LIMIT));
    }

    @Test
    @DisplayName("비회원 댓글 작성 성공")
    void createComment_guest_success() {
        CommentCreateRequest request = buildGuestRequest("안녕!", "assets/sticker/a.png", 2, "게스트", "1234");

        given(wishBoardRepository.findByBoardSlug("abc123def4")).willReturn(Optional.of(board));
        given(wishCommentRepository.existsByBoardIdAndSlotIndexNative(10L, 2)).willReturn(false);
        given(passwordEncoder.encode("1234")).willReturn("$2a$hashed_password");

        WishComment saved = WishComment.builder()
                .wishBoard(board).user(null).senderName("게스트")
                .isUser(false).content("안녕!").stickerKey("assets/sticker/a.png").slotIndex(2)
                .guestPassword("1234")
                .build();
        ReflectionTestUtils.setField(saved, "id", 200L);
        given(wishCommentRepository.saveAndFlush(any())).willReturn(saved);

        CommentCreateResponse response = wishCommentService.createComment(null, "abc123def4", request);

        assertThat(response.getId()).isEqualTo(200L);
        assertThat(response.getSlotIndex()).isEqualTo(2);
    }

    @Test
    @DisplayName("비회원 댓글 작성 실패 - guestNickname 누락")
    void createComment_guest_missingNickname() {
        CommentCreateRequest request = buildGuestRequest("안녕!", null, 2, null, "1234");

        assertThatThrownBy(() ->
                wishCommentService.createComment(null, "abc123def4", request))
                .isInstanceOf(CustomException.class)
                .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                        .isEqualTo(ErrorCode.COMMENT_GUEST_REQUIRED));
    }

    @Test
    @DisplayName("비회원 댓글 작성 실패 - guestPassword 누락")
    void createComment_guest_missingPassword() {
        CommentCreateRequest request = buildGuestRequest("안녕!", null, 2, "게스트", null);

        assertThatThrownBy(() ->
                wishCommentService.createComment(null, "abc123def4", request))
                .isInstanceOf(CustomException.class)
                .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                        .isEqualTo(ErrorCode.COMMENT_GUEST_REQUIRED));
    }

    @Test
    @DisplayName("비회원 댓글 작성 실패 - 10초 레이트 리밋")
    void createComment_guest_rateLimitExceeded() {
        CommentCreateRequest request = buildGuestRequest("첫 댓글", null, 0, "게스트", "1234");

        given(wishBoardRepository.findByBoardSlug("abc123def4")).willReturn(Optional.of(board));
        given(wishCommentRepository.existsByBoardIdAndSlotIndexNative(10L, 0)).willReturn(false);
        given(passwordEncoder.encode("1234")).willReturn("$2a$hashed_password");

        WishComment saved = WishComment.builder()
                .wishBoard(board).user(null).senderName("게스트")
                .isUser(false).content("첫 댓글").slotIndex(0).build();
        ReflectionTestUtils.setField(saved, "id", 1L);
        given(wishCommentRepository.saveAndFlush(any())).willReturn(saved);

        wishCommentService.createComment(null, "abc123def4", request);

        CommentCreateRequest request2 = buildGuestRequest("두 번째", null, 1, "게스트", "1234");

        assertThatThrownBy(() ->
                wishCommentService.createComment(null, "abc123def4", request2))
                .isInstanceOf(CustomException.class)
                .satisfies(e -> assertThat(((CustomException) e).getErrorCode())
                        .isEqualTo(ErrorCode.COMMENT_RATE_LIMIT));
    }

    // ===================== getComments =====================

    @Test
    @DisplayName("댓글 목록 조회 성공 - slotIndex 오름차순 정렬")
    void getComments_orderedBySlotIndex() {
        WishComment comment0 = WishComment.builder()
                .wishBoard(board).user(sender).senderName("테스터")
                .isUser(true).content("슬롯0").slotIndex(0).build();
        WishComment comment2 = WishComment.builder()
                .wishBoard(board).user(sender).senderName("테스터")
                .isUser(true).content("슬롯2").slotIndex(2).build();

        given(wishBoardRepository.findByBoardSlug("abc123def4")).willReturn(Optional.of(board));
        given(wishCommentRepository.findByWishBoardOrderBySlotIndexAsc(eq(board), any()))
                .willReturn(new PageImpl<>(List.of(comment0, comment2), PageRequest.of(0, 6), 2));

        CommentListResponse response = wishCommentService.getComments("abc123def4", 0, 6, 1L);

        assertThat(response.getComments()).hasSize(2);
        assertThat(response.getComments().get(0).getSlotIndex()).isEqualTo(0);
        assertThat(response.getComments().get(1).getSlotIndex()).isEqualTo(2);
    }

    @Test
    @DisplayName("댓글 목록 조회 - 비로그인 사용자는 isUser 항상 false")
    void getComments_anonymous_isUserFalse() {
        WishComment comment = WishComment.builder()
                .wishBoard(board).user(sender).senderName("테스터")
                .isUser(true).content("댓글").slotIndex(1).build();

        given(wishBoardRepository.findByBoardSlug("abc123def4")).willReturn(Optional.of(board));
        given(wishCommentRepository.findByWishBoardOrderBySlotIndexAsc(eq(board), any()))
                .willReturn(new PageImpl<>(List.of(comment), PageRequest.of(0, 6), 1));

        CommentListResponse response = wishCommentService.getComments("abc123def4", 0, 6, null);

        assertThat(response.getComments().get(0).isUser()).isFalse();
    }

    // ===================== getComments - 댓글 공개 시각 마스킹 =====================

    @Test
    @DisplayName("공개 시각 이전 - 타인 댓글은 content와 stickerKey 모두 null로 마스킹됨")
    void getComments_beforeReveal_otherUserContentAndStickerMasked() {
        ReflectionTestUtils.setField(wishCommentService, "clock", CLOCK_BEFORE_REVEAL);

        User other = User.builder().username("other").nickname("타인").passwordHash("x")
                .role(Role.CHILD).status(Status.ACTIVE).build();
        ReflectionTestUtils.setField(other, "id", 99L);

        WishComment otherComment = WishComment.builder()
                .wishBoard(board).user(other).senderName("타인")
                .isUser(true).content("비밀 댓글").stickerKey("sticker.png").slotIndex(1).build();

        given(wishBoardRepository.findByBoardSlug("abc123def4")).willReturn(Optional.of(board));
        given(wishCommentRepository.findByWishBoardOrderBySlotIndexAsc(eq(board), any()))
                .willReturn(new PageImpl<>(List.of(otherComment), PageRequest.of(0, 6), 1));

        CommentListResponse response = wishCommentService.getComments("abc123def4", 0, 6, 1L);

        CommentResponse result = response.getComments().get(0);
        assertThat(result.getContent()).isNull();
        assertThat(result.getStickerKey()).isNull();
        assertThat(result.getSlotIndex()).isEqualTo(1); // 슬롯 위치는 유지
    }

    @Test
    @DisplayName("공개 시각 이전 - 본인 댓글은 content와 stickerKey 모두 그대로 반환됨")
    void getComments_beforeReveal_ownCommentFullyVisible() {
        ReflectionTestUtils.setField(wishCommentService, "clock", CLOCK_BEFORE_REVEAL);

        WishComment myComment = WishComment.builder()
                .wishBoard(board).user(sender).senderName("테스터")
                .isUser(true).content("내 댓글").stickerKey("sticker.png").slotIndex(0).build();

        given(wishBoardRepository.findByBoardSlug("abc123def4")).willReturn(Optional.of(board));
        given(wishCommentRepository.findByWishBoardOrderBySlotIndexAsc(eq(board), any()))
                .willReturn(new PageImpl<>(List.of(myComment), PageRequest.of(0, 6), 1));

        CommentListResponse response = wishCommentService.getComments("abc123def4", 0, 6, 1L);

        CommentResponse result = response.getComments().get(0);
        assertThat(result.getContent()).isEqualTo("내 댓글");
        assertThat(result.getStickerKey()).isEqualTo("sticker.png");
    }

    @Test
    @DisplayName("공개 시각 이후 - 타인 댓글의 content와 stickerKey 모두 공개됨")
    void getComments_afterReveal_allContentAndStickerVisible() {
        User other = User.builder().username("other").nickname("타인").passwordHash("x")
                .role(Role.CHILD).status(Status.ACTIVE).build();
        ReflectionTestUtils.setField(other, "id", 99L);

        WishComment otherComment = WishComment.builder()
                .wishBoard(board).user(other).senderName("타인")
                .isUser(true).content("이제 공개됐어요").stickerKey("sticker.png").slotIndex(1).build();

        given(wishBoardRepository.findByBoardSlug("abc123def4")).willReturn(Optional.of(board));
        given(wishCommentRepository.findByWishBoardOrderBySlotIndexAsc(eq(board), any()))
                .willReturn(new PageImpl<>(List.of(otherComment), PageRequest.of(0, 6), 1));

        CommentListResponse response = wishCommentService.getComments("abc123def4", 0, 6, 1L);

        CommentResponse result = response.getComments().get(0);
        assertThat(result.getContent()).isEqualTo("이제 공개됐어요");
        assertThat(result.getStickerKey()).isEqualTo("sticker.png");
    }

    @Test
    @DisplayName("공개 시각 이전 - 비로그인 사용자는 모든 댓글 content와 stickerKey가 null")
    void getComments_beforeReveal_anonymousAllMasked() {
        ReflectionTestUtils.setField(wishCommentService, "clock", CLOCK_BEFORE_REVEAL);

        WishComment comment = WishComment.builder()
                .wishBoard(board).user(sender).senderName("테스터")
                .isUser(true).content("댓글 내용").stickerKey("sticker.png").slotIndex(0).build();

        given(wishBoardRepository.findByBoardSlug("abc123def4")).willReturn(Optional.of(board));
        given(wishCommentRepository.findByWishBoardOrderBySlotIndexAsc(eq(board), any()))
                .willReturn(new PageImpl<>(List.of(comment), PageRequest.of(0, 6), 1));

        CommentListResponse response = wishCommentService.getComments("abc123def4", 0, 6, null);

        CommentResponse result = response.getComments().get(0);
        assertThat(result.getContent()).isNull();
        assertThat(result.getStickerKey()).isNull();
    }

    @Test
    @DisplayName("공개 시각 이전 - 어드민 보드는 타인 댓글도 마스킹 없이 전체 공개")
    void getComments_beforeReveal_adminBoard_allCommentsFullyVisible() {
        ReflectionTestUtils.setField(wishCommentService, "clock", CLOCK_BEFORE_REVEAL);

        User adminUser = User.builder().username("ohjeomoh").nickname("오점오").passwordHash("x")
                .role(Role.ADMIN).status(Status.ACTIVE).build();
        ReflectionTestUtils.setField(adminUser, "id", 2L);

        WishBoard adminBoard = WishBoard.builder()
                .user(adminUser).boardSlug("ohjeomoh").isPublic(true)
                .targetDate(LocalDate.of(2026, 5, 5)).build();
        ReflectionTestUtils.setField(adminBoard, "id", 20L);

        User other = User.builder().username("other").nickname("타인").passwordHash("x")
                .role(Role.CHILD).status(Status.ACTIVE).build();
        ReflectionTestUtils.setField(other, "id", 99L);

        WishComment otherComment = WishComment.builder()
                .wishBoard(adminBoard).user(other).senderName("타인")
                .isUser(true).content("축하해요!").stickerKey("sticker.png").slotIndex(1).build();

        given(wishBoardRepository.findByBoardSlug("ohjeomoh")).willReturn(Optional.of(adminBoard));
        given(wishCommentRepository.findByWishBoardOrderBySlotIndexAsc(eq(adminBoard), any()))
                .willReturn(new PageImpl<>(List.of(otherComment), PageRequest.of(0, 6), 1));

        CommentListResponse response = wishCommentService.getComments("ohjeomoh", 0, 6, 99L);

        CommentResponse result = response.getComments().get(0);
        assertThat(result.getContent()).isEqualTo("축하해요!");
        assertThat(result.getStickerKey()).isEqualTo("sticker.png");
    }

    @Test
    @DisplayName("공개 시각 이전 - 어드민 보드는 비로그인 사용자도 모든 댓글 내용 공개")
    void getComments_beforeReveal_adminBoard_anonymousFullyVisible() {
        ReflectionTestUtils.setField(wishCommentService, "clock", CLOCK_BEFORE_REVEAL);

        User adminUser = User.builder().username("ohjeomoh").nickname("오점오").passwordHash("x")
                .role(Role.ADMIN).status(Status.ACTIVE).build();
        ReflectionTestUtils.setField(adminUser, "id", 2L);

        WishBoard adminBoard = WishBoard.builder()
                .user(adminUser).boardSlug("ohjeomoh").isPublic(true)
                .targetDate(LocalDate.of(2026, 5, 5)).build();
        ReflectionTestUtils.setField(adminBoard, "id", 20L);

        WishComment comment = WishComment.builder()
                .wishBoard(adminBoard).user(sender).senderName("테스터")
                .isUser(true).content("비로그인도 보여요").stickerKey("sticker.png").slotIndex(0).build();

        given(wishBoardRepository.findByBoardSlug("ohjeomoh")).willReturn(Optional.of(adminBoard));
        given(wishCommentRepository.findByWishBoardOrderBySlotIndexAsc(eq(adminBoard), any()))
                .willReturn(new PageImpl<>(List.of(comment), PageRequest.of(0, 6), 1));

        CommentListResponse response = wishCommentService.getComments("ohjeomoh", 0, 6, null);

        CommentResponse result = response.getComments().get(0);
        assertThat(result.getContent()).isEqualTo("비로그인도 보여요");
        assertThat(result.getStickerKey()).isEqualTo("sticker.png");
        assertThat(result.isUser()).isFalse();
    }

    @Test
    @DisplayName("공개 시각 정각 - 공개된 것으로 처리됨 (경계값)")
    void getComments_exactRevealAt_contentAndStickerVisible() {
        Clock clockAtReveal = Clock.fixed(REVEAL_AT.atZone(KST).toInstant(), KST);
        ReflectionTestUtils.setField(wishCommentService, "clock", clockAtReveal);

        User other = User.builder().username("other").nickname("타인").passwordHash("x")
                .role(Role.CHILD).status(Status.ACTIVE).build();
        ReflectionTestUtils.setField(other, "id", 99L);

        WishComment comment = WishComment.builder()
                .wishBoard(board).user(other).senderName("타인")
                .isUser(true).content("정각 공개").stickerKey("sticker.png").slotIndex(2).build();

        given(wishBoardRepository.findByBoardSlug("abc123def4")).willReturn(Optional.of(board));
        given(wishCommentRepository.findByWishBoardOrderBySlotIndexAsc(eq(board), any()))
                .willReturn(new PageImpl<>(List.of(comment), PageRequest.of(0, 6), 1));

        CommentListResponse response = wishCommentService.getComments("abc123def4", 0, 6, 1L);

        CommentResponse result = response.getComments().get(0);
        assertThat(result.getContent()).isEqualTo("정각 공개");
        assertThat(result.getStickerKey()).isEqualTo("sticker.png");
    }

    // ===================== getComments - isLastPageFull =====================

    @Test
    @DisplayName("마지막 페이지가 꽉 찬 경우 isLastPageFull = true")
    void getComments_isLastPageFull_true_whenExactlyDivisibleBySix() {
        given(wishBoardRepository.findByBoardSlug("abc123def4")).willReturn(Optional.of(board));
        given(wishCommentRepository.findByWishBoardOrderBySlotIndexAsc(eq(board), any()))
                .willReturn(new PageImpl<>(buildComments(6), PageRequest.of(0, 6), 12));

        CommentListResponse response = wishCommentService.getComments("abc123def4", 0, 6, null);

        assertThat(response.isLastPageFull()).isTrue();
    }

    @Test
    @DisplayName("마지막 페이지에 빈 슬롯이 있는 경우 isLastPageFull = false")
    void getComments_isLastPageFull_false_whenNotDivisibleBySix() {
        given(wishBoardRepository.findByBoardSlug("abc123def4")).willReturn(Optional.of(board));
        given(wishCommentRepository.findByWishBoardOrderBySlotIndexAsc(eq(board), any()))
                .willReturn(new PageImpl<>(buildComments(3), PageRequest.of(0, 6), 9));

        CommentListResponse response = wishCommentService.getComments("abc123def4", 0, 6, null);

        assertThat(response.isLastPageFull()).isFalse();
    }

    @Test
    @DisplayName("댓글이 하나도 없으면 isLastPageFull = false")
    void getComments_isLastPageFull_false_whenNoComments() {
        given(wishBoardRepository.findByBoardSlug("abc123def4")).willReturn(Optional.of(board));
        given(wishCommentRepository.findByWishBoardOrderBySlotIndexAsc(eq(board), any()))
                .willReturn(new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 6), 0));

        CommentListResponse response = wishCommentService.getComments("abc123def4", 0, 6, null);

        assertThat(response.isLastPageFull()).isFalse();
    }

    @Test
    @DisplayName("정확히 6의 배수(6, 12, 18...)일 때만 isLastPageFull = true")
    void getComments_isLastPageFull_trueOnlyForMultiplesOfSix() {
        long[] fullCounts    = {6, 12, 18, 24};
        long[] partialCounts = {1, 5, 7, 11, 13};

        for (long count : fullCounts) {
            given(wishBoardRepository.findByBoardSlug("abc123def4")).willReturn(Optional.of(board));
            given(wishCommentRepository.findByWishBoardOrderBySlotIndexAsc(eq(board), any()))
                    .willReturn(new PageImpl<>(buildComments(6), PageRequest.of(0, 6), count));

            CommentListResponse response = wishCommentService.getComments("abc123def4", 0, 6, null);
            assertThat(response.isLastPageFull())
                    .as("totalCount=%d 일 때 isLastPageFull은 true여야 합니다", count)
                    .isTrue();
        }

        for (long count : partialCounts) {
            given(wishBoardRepository.findByBoardSlug("abc123def4")).willReturn(Optional.of(board));
            given(wishCommentRepository.findByWishBoardOrderBySlotIndexAsc(eq(board), any()))
                    .willReturn(new PageImpl<>(buildComments(3), PageRequest.of(0, 6), count));

            CommentListResponse response = wishCommentService.getComments("abc123def4", 0, 6, null);
            assertThat(response.isLastPageFull())
                    .as("totalCount=%d 일 때 isLastPageFull은 false여야 합니다", count)
                    .isFalse();
        }
    }

    // ===================== deleteComment (softDelete) =====================

    @Test
    @DisplayName("댓글 삭제 - senderName이 '(삭제된사용자)'로 변경됨")
    void deleteComment_senderNameChanged() {
        WishComment comment = WishComment.builder()
                .wishBoard(board).user(sender).senderName("테스터")
                .isUser(true).content("원래 내용").stickerKey("assets/sticker/a.png").slotIndex(0)
                .build();
        ReflectionTestUtils.setField(comment, "id", 1L);

        given(wishCommentRepository.findById(1L)).willReturn(Optional.of(comment));

        wishCommentService.deleteComment(1L, "abc123def4", 1L);

        assertThat(comment.getSenderName()).isEqualTo("(삭제된사용자)");
    }

    @Test
    @DisplayName("댓글 삭제 - content가 '삭제된 댓글입니다.'로 변경됨")
    void deleteComment_contentChanged() {
        WishComment comment = WishComment.builder()
                .wishBoard(board).user(sender).senderName("테스터")
                .isUser(true).content("원래 내용").stickerKey("assets/sticker/a.png").slotIndex(0)
                .build();
        ReflectionTestUtils.setField(comment, "id", 1L);

        given(wishCommentRepository.findById(1L)).willReturn(Optional.of(comment));

        wishCommentService.deleteComment(1L, "abc123def4", 1L);

        assertThat(comment.getContent()).isEqualTo("삭제된 댓글입니다.");
    }

    @Test
    @DisplayName("댓글 삭제 - stickerKey는 삭제되지 않고 유지됨")
    void deleteComment_stickerKeyPreserved() {
        WishComment comment = WishComment.builder()
                .wishBoard(board).user(sender).senderName("테스터")
                .isUser(true).content("원래 내용").stickerKey("assets/sticker/a.png").slotIndex(0)
                .build();
        ReflectionTestUtils.setField(comment, "id", 1L);

        given(wishCommentRepository.findById(1L)).willReturn(Optional.of(comment));

        wishCommentService.deleteComment(1L, "abc123def4", 1L);

        assertThat(comment.getStickerKey()).isEqualTo("assets/sticker/a.png");
    }

    @Test
    @DisplayName("댓글 삭제 - user가 null이 되고 isUser가 false로 변경됨")
    void deleteComment_userNulledAndIsUserFalse() {
        WishComment comment = WishComment.builder()
                .wishBoard(board).user(sender).senderName("테스터")
                .isUser(true).content("원래 내용").stickerKey("assets/sticker/a.png").slotIndex(0)
                .build();
        ReflectionTestUtils.setField(comment, "id", 1L);

        given(wishCommentRepository.findById(1L)).willReturn(Optional.of(comment));

        wishCommentService.deleteComment(1L, "abc123def4", 1L);

        assertThat(comment.getUser()).isNull();
        assertThat(comment.getIsUser()).isFalse();
    }

    // ===== helpers =====

    private CommentCreateRequest buildRequest(String content, String stickerKey, int slotIndex) {
        CommentCreateRequest request = new CommentCreateRequest();
        ReflectionTestUtils.setField(request, "content", content);
        ReflectionTestUtils.setField(request, "stickerKey", stickerKey);
        ReflectionTestUtils.setField(request, "slotIndex", slotIndex);
        return request;
    }

    private CommentCreateRequest buildGuestRequest(String content, String stickerKey, int slotIndex,
                                                    String guestNickname, String guestPassword) {
        CommentCreateRequest request = new CommentCreateRequest();
        ReflectionTestUtils.setField(request, "content", content);
        ReflectionTestUtils.setField(request, "stickerKey", stickerKey);
        ReflectionTestUtils.setField(request, "slotIndex", slotIndex);
        ReflectionTestUtils.setField(request, "guestNickname", guestNickname);
        ReflectionTestUtils.setField(request, "guestPassword", guestPassword);
        return request;
    }

    private List<WishComment> buildComments(int count) {
        return IntStream.range(0, count)
                .mapToObj(i -> WishComment.builder()
                        .wishBoard(board)
                        .user(sender)
                        .senderName("테스터")
                        .isUser(true)
                        .content("댓글 " + i)
                        .slotIndex(i)
                        .build())
                .toList();
    }
}
