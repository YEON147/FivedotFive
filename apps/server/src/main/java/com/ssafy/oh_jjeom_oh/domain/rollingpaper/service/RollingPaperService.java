package com.ssafy.oh_jjeom_oh.domain.rollingpaper.service;

import com.ssafy.oh_jjeom_oh.common.exception.CustomException;
import com.ssafy.oh_jjeom_oh.common.exception.ErrorCode;
import com.ssafy.oh_jjeom_oh.common.util.SlugGenerator;
import com.ssafy.oh_jjeom_oh.common.util.TokenGenerator;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.request.RollingPaperCreateRequest;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.request.RollingPaperUpdateRequest;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response.RollingPaperCreateResponse;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response.RollingPaperDetailResponse;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response.RollingPaperSaveResponse;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response.RollingPaperSummaryResponse;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.entity.RollingPaper;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.entity.RollingPaperComment;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishBoardRepository;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.repository.RollingPaperCommentRepository;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.repository.RollingPaperRepository;
import com.ssafy.oh_jjeom_oh.domain.user.entity.User;
import com.ssafy.oh_jjeom_oh.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RollingPaperService {

    private static final int MAX_ROLLING_PAPERS = 5;

    private final RollingPaperRepository rollingPaperRepository;
    private final RollingPaperCommentRepository rollingPaperCommentRepository;
    private final WishBoardRepository wishBoardRepository;
    private final UserRepository userRepository;

    // POST /api/rolling-papers - 롤링페이퍼 생성 (위시보드+롤링페이퍼 합산 최대 5개)
    @Transactional
    public RollingPaperCreateResponse createRollingPaper(Long userId, RollingPaperCreateRequest request) {
        long boardCount = wishBoardRepository.countByUser_IdAndIsSavedCopyFalse(userId);
        long paperCount = rollingPaperRepository.countByUser_IdAndIsSavedCopyFalse(userId);
        if (boardCount + paperCount >= MAX_ROLLING_PAPERS) {
            throw new CustomException(ErrorCode.ROLLING_PAPER_LIMIT_EXCEEDED);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        String slug;
        do { slug = SlugGenerator.generate(); }
        while (rollingPaperRepository.existsBySlug(slug));

        String commentToken;
        do { commentToken = TokenGenerator.generate(); }
        while (rollingPaperRepository.existsByCommentToken(commentToken));

        String viewToken;
        do { viewToken = TokenGenerator.generate(); }
        while (rollingPaperRepository.existsByViewToken(viewToken));

        RollingPaper paper = RollingPaper.builder()
                .user(user)
                .slug(slug)
                .title(request.title())
                .recipientName(request.recipientName())
                .imageKey(request.imageKey())
                .targetDate(request.targetDate())
                .commentToken(commentToken)
                .viewToken(viewToken)
                .build();
        rollingPaperRepository.save(paper);

        return RollingPaperCreateResponse.from(paper);
    }

    // GET /api/rolling-papers/{slug} - 롤링페이퍼 단건 조회 (토큰 또는 소유자)
    public RollingPaperDetailResponse getRollingPaper(Long userId, String slug, String token) {
        RollingPaper paper = rollingPaperRepository.findBySlug(slug)
                .orElseThrow(() -> new CustomException(ErrorCode.ROLLING_PAPER_NOT_FOUND));

        if (paper.isDeleted() || paper.getIsSavedCopy()) {
            throw new CustomException(ErrorCode.ROLLING_PAPER_NOT_FOUND);
        }

        boolean isOwner = userId != null && paper.getUser().getId().equals(userId);
        boolean commentTokenMatch = token != null && token.equals(paper.getCommentToken());
        boolean viewTokenMatch   = token != null && token.equals(paper.getViewToken());

        if (!isOwner && !commentTokenMatch && !viewTokenMatch) {
            throw new CustomException(ErrorCode.ROLLING_PAPER_FORBIDDEN);
        }

        boolean canComment = isOwner || commentTokenMatch;
        boolean canSave    = isOwner || viewTokenMatch;

        return RollingPaperDetailResponse.of(paper, isOwner, canComment, canSave);
    }

    // PATCH /api/rolling-papers/{slug} - 롤링페이퍼 수정 (소유자)
    @Transactional
    public RollingPaperDetailResponse updateRollingPaper(Long userId, String slug, RollingPaperUpdateRequest request) {
        RollingPaper paper = rollingPaperRepository.findBySlug(slug)
                .orElseThrow(() -> new CustomException(ErrorCode.ROLLING_PAPER_NOT_FOUND));

        if (!paper.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.ROLLING_PAPER_FORBIDDEN);
        }

        if (request.title() != null)         paper.updateTitle(request.title());
        if (request.recipientName() != null) paper.updateRecipientName(request.recipientName());
        if (request.targetDate() != null)    paper.updateTargetDate(request.targetDate());
        if (request.imageKey() != null)      paper.updateImageKey(request.imageKey());

        return RollingPaperDetailResponse.of(paper, true, true, true);
    }

    // DELETE /api/rolling-papers/{slug} - 롤링페이퍼 삭제 (소유자, Hard Delete)
    @Transactional
    public void deleteRollingPaper(Long userId, String slug) {
        RollingPaper paper = rollingPaperRepository.findBySlug(slug)
                .orElseThrow(() -> new CustomException(ErrorCode.ROLLING_PAPER_NOT_FOUND));

        if (!paper.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.ROLLING_PAPER_DELETE_FORBIDDEN);
        }

        rollingPaperCommentRepository.deleteByRollingPaper(paper);
        rollingPaperRepository.delete(paper);
    }

    // GET /api/rolling-papers/me/list - 내 롤링페이퍼 목록 (원본만, 최신순)
    public List<RollingPaperSummaryResponse> getMyRollingPapers(Long userId) {
        return rollingPaperRepository
                .findAllByUser_IdAndIsSavedCopyFalseOrderByCreatedAtDesc(userId)
                .stream()
                .map(RollingPaperSummaryResponse::from)
                .collect(Collectors.toList());
    }

    // POST /api/rolling-papers/{slug}/save - 롤링페이퍼 독립 복사본 저장 (commentToken 또는 viewToken 소지자)
    @Transactional
    public RollingPaperSaveResponse saveRollingPaper(Long userId, String slug, String token) {
        RollingPaper original = rollingPaperRepository.findBySlug(slug)
                .orElseThrow(() -> new CustomException(ErrorCode.ROLLING_PAPER_NOT_FOUND));

        if (original.isDeleted() || original.getIsSavedCopy()) {
            throw new CustomException(ErrorCode.ROLLING_PAPER_NOT_FOUND);
        }

        if (original.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.ROLLING_PAPER_CANNOT_SAVE_OWN);
        }

        // commentToken 또는 viewToken 검증
        boolean hasToken = token != null
                && (token.equals(original.getCommentToken()) || token.equals(original.getViewToken()));
        if (!hasToken) {
            throw new CustomException(ErrorCode.ROLLING_PAPER_FORBIDDEN);
        }

        User saver = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        String newSlug;
        do { newSlug = SlugGenerator.generate(); }
        while (rollingPaperRepository.existsBySlug(newSlug));

        RollingPaper copy = RollingPaper.builder()
                .user(original.getUser())
                .slug(newSlug)
                .title(original.getTitle())
                .recipientName(original.getRecipientName())
                .imageKey(original.getImageKey())
                .targetDate(original.getTargetDate())
                .commentToken(null)
                .viewToken(null)
                .isSavedCopy(true)
                .savedByUser(saver)
                .saveSource("RECEIVED")
                .build();
        rollingPaperRepository.save(copy);

        // 댓글 복사 (비밀번호 제외 — 저장본에서는 수정/삭제 불필요)
        for (RollingPaperComment c : rollingPaperCommentRepository.findAllByRollingPaper(original)) {
            rollingPaperCommentRepository.save(RollingPaperComment.builder()
                    .rollingPaper(copy)
                    .user(c.getUser())
                    .isUser(c.getIsUser())
                    .senderName(c.getSenderName())
                    .content(c.getContent())
                    .stickerKey(c.getStickerKey())
                    .slotIndex(c.getSlotIndex())
                    .guestPassword(null)
                    .build());
        }

        return RollingPaperSaveResponse.of(newSlug);
    }

    // GET /api/rolling-papers/me/saved - 내가 저장한 롤링페이퍼 복사본 목록
    public List<RollingPaperSummaryResponse> getMySavedRollingPapers(Long userId) {
        return rollingPaperRepository
                .findAllBySavedByUser_IdAndIsSavedCopyTrueOrderByCreatedAtDesc(userId)
                .stream()
                .map(RollingPaperSummaryResponse::from)
                .collect(Collectors.toList());
    }
}
