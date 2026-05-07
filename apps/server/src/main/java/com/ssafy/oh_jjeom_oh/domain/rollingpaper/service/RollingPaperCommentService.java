package com.ssafy.oh_jjeom_oh.domain.rollingpaper.service;

import com.ssafy.oh_jjeom_oh.common.exception.CustomException;
import com.ssafy.oh_jjeom_oh.common.exception.ErrorCode;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.request.RollingPaperCommentCreateRequest;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.request.RollingPaperCommentUpdateRequest;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response.RollingPaperCommentCreateResponse;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response.RollingPaperCommentListResponse;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response.RollingPaperCommentResponse;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.entity.RollingPaper;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.entity.RollingPaperComment;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.repository.RollingPaperCommentRepository;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.repository.RollingPaperRepository;
import com.ssafy.oh_jjeom_oh.domain.user.entity.User;
import com.ssafy.oh_jjeom_oh.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RollingPaperCommentService {

    private static final long RATE_LIMIT_MILLIS = 10_000L;
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final RollingPaperRepository rollingPaperRepository;
    private final RollingPaperCommentRepository rollingPaperCommentRepository;
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final Clock clock;

    // userId → 마지막 댓글 작성 시각(ms) — 회원 전용 rate-limit
    private final Map<Long, Long> lastCommentTimeMap = new ConcurrentHashMap<>();

    // GET /api/rolling-papers/{slug}/comments?page=0&size=6
    public RollingPaperCommentListResponse getComments(String slug, int page, int size,
                                                        Long requestUserId, String token) {
        RollingPaper paper = getPaperBySlug(slug);
        validateReadAccess(paper, requestUserId, token);

        LocalDate today = clock.instant().atZone(KST).toLocalDate();
        boolean revealed = paper.getTargetDate() != null && !today.isBefore(paper.getTargetDate());

        Page<RollingPaperComment> commentPage =
                rollingPaperCommentRepository.findByRollingPaperOrderBySlotIndexAsc(
                        paper, PageRequest.of(page, size));

        List<RollingPaperCommentResponse> comments = commentPage.getContent().stream()
                .map(c -> requestUserId != null
                        ? RollingPaperCommentResponse.of(c, requestUserId, revealed)
                        : RollingPaperCommentResponse.ofAnonymous(c, revealed))
                .toList();

        return RollingPaperCommentListResponse.of(commentPage, comments);
    }

    // POST /api/rolling-papers/{slug}/comments
    @Transactional
    public RollingPaperCommentCreateResponse createComment(Long userId, String slug, String token,
                                                            RollingPaperCommentCreateRequest request) {
        RollingPaper paper = getPaperBySlug(slug);
        validateCommentAccess(paper, userId, token);

        // 회원 댓글 rate limit
        if (userId != null) {
            long now = System.currentTimeMillis();
            Long last = lastCommentTimeMap.get(userId);
            if (last != null && now - last < RATE_LIMIT_MILLIS) {
                throw new CustomException(ErrorCode.COMMENT_RATE_LIMIT);
            }
        }

        // 슬롯 중복 검사 (소프트딜리트 포함)
        if (rollingPaperCommentRepository.existsByPaperIdAndSlotIndexNative(
                paper.getId(), request.getSlotIndex())) {
            throw new CustomException(ErrorCode.COMMENT_SLOT_CONFLICT);
        }

        RollingPaperComment comment;
        if (userId != null) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
            comment = RollingPaperComment.builder()
                    .rollingPaper(paper)
                    .user(user)
                    .isUser(true)
                    .senderName(user.getNickname())
                    .content(request.getContent())
                    .stickerKey(request.getStickerKey())
                    .slotIndex(request.getSlotIndex())
                    .build();
        } else {
            if (request.getSenderName() == null || request.getSenderName().isBlank()) {
                throw new CustomException(ErrorCode.RP_COMMENT_SENDER_NAME_REQUIRED);
            }
            if (request.getGuestPassword() == null || request.getGuestPassword().isBlank()) {
                throw new CustomException(ErrorCode.RP_COMMENT_PASSWORD_REQUIRED);
            }
            comment = RollingPaperComment.builder()
                    .rollingPaper(paper)
                    .user(null)
                    .isUser(false)
                    .senderName(request.getSenderName())
                    .content(request.getContent())
                    .stickerKey(request.getStickerKey())
                    .slotIndex(request.getSlotIndex())
                    .guestPassword(passwordEncoder.encode(request.getGuestPassword()))
                    .build();
        }

        try {
            RollingPaperComment saved = rollingPaperCommentRepository.saveAndFlush(comment);
            if (userId != null) lastCommentTimeMap.put(userId, System.currentTimeMillis());
            return RollingPaperCommentCreateResponse.of(saved);
        } catch (DataIntegrityViolationException e) {
            throw new CustomException(ErrorCode.COMMENT_SLOT_CONFLICT);
        }
    }

    // PATCH /api/rolling-papers/{slug}/comments/{commentId}
    @Transactional
    public void updateComment(Long userId, String slug, Long commentId,
                               RollingPaperCommentUpdateRequest request) {
        RollingPaperComment comment = getCommentAndValidateOwner(
                commentId, slug, userId, request.getGuestPassword());
        comment.updateContent(request.getContent());
    }

    // DELETE /api/rolling-papers/{slug}/comments/{commentId}
    @Transactional
    public void deleteComment(Long userId, String slug, Long commentId, String guestPassword) {
        RollingPaperComment comment = getCommentAndValidateOwner(commentId, slug, userId, guestPassword);
        comment.softDelete();
    }

    // ===== private helpers =====

    private RollingPaper getPaperBySlug(String slug) {
        return rollingPaperRepository.findBySlug(slug)
                .orElseThrow(() -> new CustomException(ErrorCode.ROLLING_PAPER_NOT_FOUND));
    }

    private boolean isOwner(RollingPaper paper, Long userId) {
        return userId != null && paper.getUser() != null
                && paper.getUser().getId().equals(userId);
    }

    /** 댓글 목록 조회 접근 권한: 소유자 | commentToken | viewToken */
    private void validateReadAccess(RollingPaper paper, Long userId, String token) {
        if (isOwner(paper, userId)) return;
        if (token != null
                && (token.equals(paper.getCommentToken()) || token.equals(paper.getViewToken()))) {
            return;
        }
        throw new CustomException(ErrorCode.ROLLING_PAPER_FORBIDDEN);
    }

    /** 댓글 작성 접근 권한: 소유자 | commentToken */
    private void validateCommentAccess(RollingPaper paper, Long userId, String token) {
        if (isOwner(paper, userId)) return;
        if (token != null && token.equals(paper.getCommentToken())) return;
        throw new CustomException(ErrorCode.ROLLING_PAPER_FORBIDDEN);
    }

    private RollingPaperComment getCommentAndValidateOwner(Long commentId, String slug,
                                                            Long userId, String guestPassword) {
        RollingPaperComment comment = rollingPaperCommentRepository.findById(commentId)
                .orElseThrow(() -> new CustomException(ErrorCode.COMMENT_NOT_FOUND));

        if (!comment.getRollingPaper().getSlug().equals(slug)) {
            throw new CustomException(ErrorCode.COMMENT_NOT_FOUND);
        }

        // 회원 댓글
        if (comment.getUser() != null) {
            if (userId == null || !comment.getUser().getId().equals(userId)) {
                throw new CustomException(ErrorCode.COMMENT_FORBIDDEN);
            }
            return comment;
        }

        // 비회원 댓글
        if (guestPassword == null || guestPassword.isBlank()
                || comment.getGuestPassword() == null
                || !passwordEncoder.matches(guestPassword, comment.getGuestPassword())) {
            throw new CustomException(ErrorCode.RP_COMMENT_WRONG_PASSWORD);
        }
        return comment;
    }
}
