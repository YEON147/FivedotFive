package com.ssafy.oh_jjeom_oh.domain.board.service;

import com.ssafy.oh_jjeom_oh.common.exception.CustomException;
import com.ssafy.oh_jjeom_oh.common.exception.ErrorCode;
import com.ssafy.oh_jjeom_oh.domain.board.dto.request.CommentCreateRequest;
import com.ssafy.oh_jjeom_oh.domain.board.dto.request.CommentStickerUpdateRequest;
import com.ssafy.oh_jjeom_oh.domain.board.dto.request.CommentUpdateRequest;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.CommentCreateResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.CommentListResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.CommentResponse;
import com.ssafy.oh_jjeom_oh.domain.board.dto.response.CommentStickerResponse;
import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishBoardRepository;
import com.ssafy.oh_jjeom_oh.domain.comment.entity.WishComment;
import com.ssafy.oh_jjeom_oh.domain.comment.repository.WishCommentRepository;
import com.ssafy.oh_jjeom_oh.domain.user.entity.User;
import com.ssafy.oh_jjeom_oh.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WishCommentService {

    private static final long RATE_LIMIT_MILLIS = 10_000L; // 10초

    private final WishBoardRepository wishBoardRepository;
    private final WishCommentRepository wishCommentRepository;
    private final UserRepository userRepository;
    private final Clock clock;

    /** 댓글 내용 전체 공개 시각 (KST 기준, 서버가 KST로 실행됨을 전제) */
    @Value("${comment.reveal-at}")
    private LocalDateTime revealAt;

    // userId -> 마지막 댓글 작성 시각 (ms)
    private final Map<Long, Long> lastCommentTimeMap = new ConcurrentHashMap<>();

    // GET /api/boards/{slug}/comments?page=0&size=6
    public CommentListResponse getComments(String slug, int page, int size, Long requestUserId) {
        WishBoard board = getBoardBySlug(slug);

        boolean revealed = !LocalDateTime.now(clock).isBefore(revealAt);

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
        // 10초 rate limit
        long now = System.currentTimeMillis();
        Long last = lastCommentTimeMap.get(userId);
        if (last != null && now - last < RATE_LIMIT_MILLIS) {
            throw new CustomException(ErrorCode.COMMENT_RATE_LIMIT);
        }

        WishBoard board = getBoardBySlug(slug);

        // 비공개 보드면 403
        if (!board.getIsPublic()) {
            throw new CustomException(ErrorCode.BOARD_PRIVATE);
        }

        // 해당 슬롯에 이미 댓글(소프트 딜리트된 것 포함)이 있으면 409
        // 네이티브 쿼리로 확인하여 향후 @Where 같은 JPA 필터가 추가되어도 안전하게 동작
        if (wishCommentRepository.existsByBoardIdAndSlotIndexNative(board.getId(), request.getSlotIndex())) {
            throw new CustomException(ErrorCode.COMMENT_SLOT_CONFLICT);
        }

        User sender = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        WishComment comment = WishComment.builder()
                .wishBoard(board)
                .user(sender)
                .senderName(sender.getNickname()) // 작성 시점 닉네임 스냅샷
                .isUser(true)
                .content(request.getContent())
                .stickerKey(request.getStickerKey())
                .slotIndex(request.getSlotIndex())
                .build();

        // existsBy 체크와 save 사이의 동시성 레이스 컨디션을 방어
        // DB Unique 제약 위반 시 500 대신 409로 변환
        try {
            WishComment saved = wishCommentRepository.saveAndFlush(comment);
            lastCommentTimeMap.put(userId, now);
            return CommentCreateResponse.of(saved);
        } catch (DataIntegrityViolationException e) {
            throw new CustomException(ErrorCode.COMMENT_SLOT_CONFLICT);
        }
    }

    // PATCH /api/boards/{slug}/comments/{commentId}
    @Transactional
    public void updateComment(Long userId, String slug, Long commentId, CommentUpdateRequest request) {
        WishComment comment = getCommentAndValidateOwner(commentId, userId, slug);
        comment.updateContent(request.getContent());
    }

    // DELETE /api/boards/{slug}/comments/{commentId}
    @Transactional
    public void deleteComment(Long userId, String slug, Long commentId) {
        WishComment comment = getCommentAndValidateOwner(commentId, userId, slug);
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
        if (!comment.getWishBoard().getBoardSlug().equals(slug)) {
            throw new CustomException(ErrorCode.COMMENT_NOT_FOUND);
        }
        return comment;
    }

    private WishBoard getBoardBySlug(String slug) {
        return wishBoardRepository.findByBoardSlug(slug)
                .orElseThrow(() -> new CustomException(ErrorCode.BOARD_SLUG_NOT_FOUND));
    }

    private WishComment getCommentAndValidateOwner(Long commentId, Long userId, String slug) {
        WishComment comment = wishCommentRepository.findById(commentId)
                .orElseThrow(() -> new CustomException(ErrorCode.COMMENT_NOT_FOUND));

        // slug와 실제 보드가 일치하는지 검증
        if (!comment.getWishBoard().getBoardSlug().equals(slug)) {
            throw new CustomException(ErrorCode.COMMENT_NOT_FOUND);
        }

        // 작성자 검증
        if (comment.getUser() == null || !comment.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.COMMENT_FORBIDDEN);
        }

        return comment;
    }
}
