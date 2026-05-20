package com.ssafy.oh_jjeom_oh.domain.board.service;

import com.ssafy.oh_jjeom_oh.common.exception.CustomException;
import com.ssafy.oh_jjeom_oh.common.exception.ErrorCode;
import com.ssafy.oh_jjeom_oh.domain.board.dto.request.CommentCreateRequest;
import com.ssafy.oh_jjeom_oh.domain.board.dto.request.CommentStickerUpdateRequest;
import com.ssafy.oh_jjeom_oh.domain.board.dto.request.CommentUpdateRequest;
import com.ssafy.oh_jjeom_oh.domain.board.dto.request.CommentVerifyRequest;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.CommentCreateResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.CommentListResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.CommentResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.CommentStickerResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.CommentVerifyResponse;
import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishBoardRepository;
import com.ssafy.oh_jjeom_oh.domain.board.support.WishBoardAccess;
import com.ssafy.oh_jjeom_oh.domain.comment.entity.WishComment;
import com.ssafy.oh_jjeom_oh.domain.comment.repository.WishCommentRepository;
import com.ssafy.oh_jjeom_oh.domain.user.entity.User;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Role;
import com.ssafy.oh_jjeom_oh.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WishCommentService {

    private static final long RATE_LIMIT_MILLIS = 10_000L; // 10초
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private static final String VERIFY_TOKEN_PREFIX = "comment:verify:";
    private static final long VERIFY_TOKEN_TTL_MINUTES = 5L;

    private final WishBoardRepository wishBoardRepository;
    private final WishCommentRepository wishCommentRepository;
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final RedisTemplate<String, String> redisTemplate;
    private final Clock clock;

    // 레이트 리밋 키 -> 마지막 댓글 작성 시각 (ms)
    // 로그인 사용자: "user:{userId}", 비로그인 사용자: "guest:{guestNickname}"
    private final Map<String, Long> lastCommentTimeMap = new ConcurrentHashMap<>();

    // GET /api/boards/{slug}/comments?page=0&size=6
    public CommentListResponse getComments(String slug, int page, int size, Long requestUserId) {
        WishBoard board = getBoardBySlug(slug);
        WishBoardAccess.requireView(board, requestUserId);

        // 어드민/구단 보드이거나 isCommentPublic=true이거나 targetDate(기념일)가 지난 경우 댓글 마스킹 해제
        Role boardOwnerRole = board.getUser().getRole();
        boolean isAlwaysRevealed = boardOwnerRole == Role.ADMIN || boardOwnerRole == Role.TEAM;
        LocalDate today = clock.instant().atZone(KST).toLocalDate();
        boolean passedTargetDate = board.getTargetDate() != null && !today.isBefore(board.getTargetDate());
        boolean revealed = isAlwaysRevealed || board.getIsCommentPublic() || passedTargetDate;

        Page<WishComment> commentPage =
                wishCommentRepository.findByWishBoardOrderBySlotIndexAsc(board, PageRequest.of(page, size));

        List<CommentResponse> comments = commentPage.getContent().stream()
                .map(c -> requestUserId != null
                        ? CommentResponse.of(c, requestUserId, revealed)
                        : CommentResponse.ofAnonymous(c, revealed))
                .toList();

        return CommentListResponse.of(commentPage, comments);
    }

    // POST /api/boards/{slug}/comments
    @Transactional
    public CommentCreateResponse createComment(Long userId, String slug, CommentCreateRequest request) {
        boolean isGuest = (userId == null);

        // 비회원 필수 파라미터 검증
        if (isGuest) {
            if (request.getGuestNickname() == null || request.getGuestNickname().isBlank()
                    || request.getGuestPassword() == null || request.getGuestPassword().isBlank()) {
                throw new CustomException(ErrorCode.COMMENT_GUEST_REQUIRED);
            }
        }

        // 10초 rate limit (로그인: "user:{id}", 비로그인: "guest:{닉네임}")
        String rateLimitKey = isGuest
                ? "guest:" + request.getGuestNickname()
                : "user:" + userId;
        long now = System.currentTimeMillis();
        Long last = lastCommentTimeMap.get(rateLimitKey);
        if (last != null && now - last < RATE_LIMIT_MILLIS) {
            throw new CustomException(ErrorCode.COMMENT_RATE_LIMIT);
        }

        WishBoard board = getBoardBySlug(slug);
        WishBoardAccess.requireView(board, userId);
        if (Boolean.TRUE.equals(board.getIsSavedCopy())) {
            throw new CustomException(ErrorCode.BOARD_FORBIDDEN);
        }
        if (!board.getIsPublic()) {
            throw new CustomException(ErrorCode.BOARD_PRIVATE);
        }

        // 해당 슬롯에 이미 댓글(소프트 딜리트된 것 포함)이 있으면 409
        // 네이티브 쿼리로 확인하여 향후 @Where 같은 JPA 필터가 추가되어도 안전하게 동작
        if (wishCommentRepository.existsByBoardIdAndSlotIndexNative(board.getId(), request.getSlotIndex())) {
            throw new CustomException(ErrorCode.COMMENT_SLOT_CONFLICT);
        }

        WishComment comment;
        if (isGuest) {
            comment = WishComment.builder()
                    .wishBoard(board)
                    .user(null)
                    .senderName(request.getGuestNickname())
                    .isUser(false)
                    .content(request.getContent())
                    .stickerKey(request.getStickerKey())
                    .slotIndex(request.getSlotIndex())
                    .guestPassword(passwordEncoder.encode(request.getGuestPassword()))
                    .build();
        } else {
            User sender = userRepository.findById(userId)
                    .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
            comment = WishComment.builder()
                    .wishBoard(board)
                    .user(sender)
                    .senderName(sender.getNickname()) // 작성 시점 닉네임 스냅샷
                    .isUser(true)
                    .content(request.getContent())
                    .stickerKey(request.getStickerKey())
                    .slotIndex(request.getSlotIndex())
                    .build();
        }

        // existsBy 체크와 save 사이의 동시성 레이스 컨디션을 방어
        // DB Unique 제약 위반 시 500 대신 409로 변환
        try {
            WishComment saved = wishCommentRepository.saveAndFlush(comment);
            lastCommentTimeMap.put(rateLimitKey, now);
            return CommentCreateResponse.of(saved);
        } catch (DataIntegrityViolationException e) {
            throw new CustomException(ErrorCode.COMMENT_SLOT_CONFLICT);
        }
    }

    // POST /api/boards/{slug}/comments/{commentId}/verify
    public CommentVerifyResponse verifyPassword(String slug, Long commentId, CommentVerifyRequest request) {
        WishComment comment = getCommentByIdAndSlug(commentId, slug);

        if (comment.getUser() != null) {
            throw new CustomException(ErrorCode.COMMENT_FORBIDDEN);
        }

        if (request.getGuestPassword() == null || request.getGuestPassword().isBlank()
                || comment.getGuestPassword() == null
                || !passwordEncoder.matches(request.getGuestPassword(), comment.getGuestPassword())) {
            throw new CustomException(ErrorCode.COMMENT_WRONG_PASSWORD);
        }

        String verifyToken = UUID.randomUUID().toString();
        redisTemplate.opsForValue().set(
                VERIFY_TOKEN_PREFIX + verifyToken,
                String.valueOf(commentId),
                VERIFY_TOKEN_TTL_MINUTES,
                TimeUnit.MINUTES
        );
        return new CommentVerifyResponse(verifyToken, comment.getContent());
    }

    // PATCH /api/boards/{slug}/comments/{commentId}
    @Transactional
    public void updateComment(Long userId, String slug, Long commentId, CommentUpdateRequest request) {
        WishComment comment = getCommentAndValidateOwnerOrGuest(
                commentId, slug, userId, request.getVerifyToken());
        comment.updateContent(request.getContent());
    }

    // DELETE /api/boards/{slug}/comments/{commentId}
    @Transactional
    public void deleteComment(Long userId, String slug, Long commentId, String verifyToken) {
        WishComment comment = getCommentAndValidateOwnerOrGuest(commentId, slug, userId, verifyToken);
        comment.softDelete();
    }

    // GET /api/boards/{slug}/comments/{commentId}/sticker - 선물 아이콘 조회 (Anyone)
    public CommentStickerResponse getSticker(String slug, Long commentId) {
        WishComment comment = getCommentByIdAndSlug(commentId, slug);
        if (comment.getStickerKey() == null) {
            throw new CustomException(ErrorCode.COMMENT_STICKER_NOT_FOUND);
        }
        return CommentStickerResponse.of(comment);
    }

    // PUT /api/boards/{slug}/comments/{commentId}/sticker - 선물 아이콘 설정/변경 (본인만)
    @Transactional
    public void updateSticker(Long userId, String slug, Long commentId, CommentStickerUpdateRequest request) {
        WishComment comment = getCommentAndValidateOwner(commentId, userId, slug);
        comment.updateStickerKey(request.getStickerKey());
    }

    // DELETE /api/boards/{slug}/comments/{commentId}/sticker - 선물 아이콘 삭제 (댓글 작성자 본인)
    @Transactional
    public void deleteSticker(Long userId, String slug, Long commentId) {
        WishComment comment = getCommentAndValidateOwner(commentId, userId, slug);
        if (comment.getStickerKey() == null) {
            throw new CustomException(ErrorCode.COMMENT_STICKER_NOT_FOUND);
        }
        comment.clearStickerKey();
    }

    // ===== private helpers =====

    private WishComment getCommentByIdAndSlug(Long commentId, String slug) {
        WishComment comment = wishCommentRepository.findById(commentId)
                .orElseThrow(() -> new CustomException(ErrorCode.COMMENT_NOT_FOUND));
        // wishBoard가 null이면 보드가 삭제된 상태 → 접근 불가
        if (comment.getWishBoard() == null || !comment.getWishBoard().getBoardSlug().equals(slug)) {
            throw new CustomException(ErrorCode.COMMENT_NOT_FOUND);
        }
        return comment;
    }

    private WishBoard getBoardBySlug(String slug) {
        return wishBoardRepository.findByBoardSlug(slug)
                .orElseThrow(() -> new CustomException(ErrorCode.BOARD_SLUG_NOT_FOUND));
    }

    /** 회원/비회원 모두 사용 - 댓글 수정·삭제용 */
    private WishComment getCommentAndValidateOwnerOrGuest(Long commentId, String slug,
                                                           Long userId, String verifyToken) {
        WishComment comment = wishCommentRepository.findById(commentId)
                .orElseThrow(() -> new CustomException(ErrorCode.COMMENT_NOT_FOUND));

        // wishBoard가 null이면 보드가 삭제된 상태 → 접근 불가
        if (comment.getWishBoard() == null || !comment.getWishBoard().getBoardSlug().equals(slug)) {
            throw new CustomException(ErrorCode.COMMENT_NOT_FOUND);
        }

        // 회원 댓글
        if (comment.getUser() != null) {
            if (userId == null || !comment.getUser().getId().equals(userId)) {
                throw new CustomException(ErrorCode.COMMENT_FORBIDDEN);
            }
            return comment;
        }

        // 비회원 댓글 - verifyToken으로 검증 (1회성)
        if (verifyToken == null || verifyToken.isBlank()) {
            throw new CustomException(ErrorCode.COMMENT_VERIFY_TOKEN_INVALID);
        }
        String key = VERIFY_TOKEN_PREFIX + verifyToken;
        String stored = redisTemplate.opsForValue().get(key);
        if (stored == null || !stored.equals(String.valueOf(commentId))) {
            throw new CustomException(ErrorCode.COMMENT_VERIFY_TOKEN_INVALID);
        }
        redisTemplate.delete(key);
        return comment;
    }

    /** 회원 전용 - 스티커 설정·삭제용 */
    private WishComment getCommentAndValidateOwner(Long commentId, Long userId, String slug) {
        WishComment comment = wishCommentRepository.findById(commentId)
                .orElseThrow(() -> new CustomException(ErrorCode.COMMENT_NOT_FOUND));

        // wishBoard가 null이면 보드가 삭제된 상태 → 접근 불가
        if (comment.getWishBoard() == null || !comment.getWishBoard().getBoardSlug().equals(slug)) {
            throw new CustomException(ErrorCode.COMMENT_NOT_FOUND);
        }

        if (comment.getUser() == null || !comment.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.COMMENT_FORBIDDEN);
        }
        return comment;
    }
}
