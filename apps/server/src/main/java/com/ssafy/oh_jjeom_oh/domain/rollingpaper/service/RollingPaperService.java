package com.ssafy.oh_jjeom_oh.domain.rollingpaper.service;

import com.ssafy.oh_jjeom_oh.common.exception.CustomException;
import com.ssafy.oh_jjeom_oh.common.exception.ErrorCode;
import com.ssafy.oh_jjeom_oh.common.util.SlugGenerator;
import com.ssafy.oh_jjeom_oh.common.util.TokenGenerator;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.request.RollingPaperCreateRequest;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.request.RollingPaperUpdateRequest;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response.RollingPaperCreateResponse;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response.RollingPaperDetailResponse;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response.RollingPaperSavedItemResponse;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response.RollingPaperSavedListResponse;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response.RollingPaperSaveResponse;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response.RollingPaperShareLinkResponse;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.dto.response.RollingPaperSummaryResponse;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.entity.RollingPaper;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.entity.RollingPaperComment;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishBoardRepository;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.repository.RollingPaperCommentRepository;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.repository.RollingPaperRepository;
import com.ssafy.oh_jjeom_oh.domain.share.service.ShareService;
import com.ssafy.oh_jjeom_oh.domain.user.entity.User;
import com.ssafy.oh_jjeom_oh.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
    private final ShareService shareService;

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

        boolean isCommentPublic = request.isCommentPublic() != null && request.isCommentPublic();

        RollingPaper paper = RollingPaper.builder()
                .user(user)
                .slug(slug)
                .title(request.title())
                .recipientName(request.recipientName())
                .imageKey(request.imageKey())
                .targetDate(request.targetDate())
                .isCommentPublic(isCommentPublic)
                .commentToken(commentToken)
                .viewToken(viewToken)
                .build();
        rollingPaperRepository.save(paper);

        String commentShareUrl = shareService.generateRollingPaperShareLink(slug, commentToken, request.targetDate());
        String viewShareUrl    = shareService.generateRollingPaperShareLink(slug, viewToken,    request.targetDate());
        return RollingPaperCreateResponse.of(slug, commentShareUrl, viewShareUrl);
    }

    // POST /api/rolling-papers/{slug}/share/comment - 댓글 작성용 단축 링크 재생성 (소유자)
    @Transactional
    public RollingPaperShareLinkResponse generateCommentShareLink(Long userId, String slug) {
        RollingPaper paper = findOriginal(slug);
        requireOwner(userId, paper);
        String shortUrl = shareService.generateRollingPaperShareLink(slug, paper.getCommentToken(), paper.getTargetDate());
        return RollingPaperShareLinkResponse.of(shortUrl, shareService.rollingPaperExpiresAt(paper.getTargetDate()));
    }

    // POST /api/rolling-papers/{slug}/share/view - 저장 전용 단축 링크 재생성 (소유자)
    @Transactional
    public RollingPaperShareLinkResponse generateViewShareLink(Long userId, String slug) {
        RollingPaper paper = findOriginal(slug);
        requireOwner(userId, paper);
        String shortUrl = shareService.generateRollingPaperShareLink(slug, paper.getViewToken(), paper.getTargetDate());
        return RollingPaperShareLinkResponse.of(shortUrl, shareService.rollingPaperExpiresAt(paper.getTargetDate()));
    }

    private RollingPaper findOriginal(String slug) {
        RollingPaper paper = rollingPaperRepository.findBySlug(slug)
                .orElseThrow(() -> new CustomException(ErrorCode.ROLLING_PAPER_NOT_FOUND));
        if (paper.getIsSavedCopy()) throw new CustomException(ErrorCode.ROLLING_PAPER_NOT_FOUND);
        return paper;
    }

    private void requireOwner(Long userId, RollingPaper paper) {
        if (!paper.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.ROLLING_PAPER_FORBIDDEN);
        }
    }

    // GET /api/rolling-papers/{slug} - 롤링페이퍼 단건 조회 (토큰 또는 소유자)
    public RollingPaperDetailResponse getRollingPaper(Long userId, String slug, String token) {
        RollingPaper paper = rollingPaperRepository.findBySlug(slug)
                .orElseThrow(() -> new CustomException(ErrorCode.ROLLING_PAPER_NOT_FOUND));

        // 복사본은 저장한 본인만 조회 가능
        if (paper.getIsSavedCopy()) {
            boolean isSaver = userId != null
                    && paper.getSavedByUser() != null
                    && paper.getSavedByUser().getId().equals(userId);
            if (!isSaver) throw new CustomException(ErrorCode.ROLLING_PAPER_NOT_FOUND);
            // 복사본은 canComment/canSave 모두 false (읽기 전용)
            return RollingPaperDetailResponse.of(paper, false, false, false);
        }

        boolean isOwner = userId != null && paper.getUser().getId().equals(userId);
        boolean commentTokenMatch = token != null && token.equals(paper.getCommentToken());
        boolean viewTokenMatch   = token != null && token.equals(paper.getViewToken());

        if (!isOwner && !commentTokenMatch && !viewTokenMatch) {
            throw new CustomException(ErrorCode.ROLLING_PAPER_FORBIDDEN);
        }

        // viewToken으로 접근한 경우 소유자라도 수신자 경험(저장 전용) 제공
        // — 소유자가 본인 viewToken 링크를 테스트하거나 수신자에게 공유한 링크로 접근 시 동일하게 처리
        if (viewTokenMatch) {
            boolean canSave = !LocalDate.now().isBefore(paper.getTargetDate());
            return RollingPaperDetailResponse.of(paper, false, false, canSave);
        }

        boolean canComment = isOwner || commentTokenMatch;
        boolean canSave    = isOwner;

        return RollingPaperDetailResponse.of(paper, isOwner, canComment, canSave);
    }

    // PATCH /api/rolling-papers/{slug} - 롤링페이퍼 수정 (소유자)
    @Transactional
    public void updateRollingPaper(Long userId, String slug, RollingPaperUpdateRequest request) {
        RollingPaper paper = rollingPaperRepository.findBySlug(slug)
                .orElseThrow(() -> new CustomException(ErrorCode.ROLLING_PAPER_NOT_FOUND));

        if (!paper.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.ROLLING_PAPER_FORBIDDEN);
        }

        if (request.title() != null)            paper.updateTitle(request.title());
        if (request.recipientName() != null)    paper.updateRecipientName(request.recipientName());
        if (request.targetDate() != null)       paper.updateTargetDate(request.targetDate());
        if (request.imageKey() != null)         paper.updateImageKey(request.imageKey());
        if (request.isCommentPublic() != null)  paper.updateIsCommentPublic(request.isCommentPublic());
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

    // DELETE /api/rolling-papers/saved/{slug} - 저장된 복사본 삭제 (저장한 본인만)
    @Transactional
    public void deleteSavedRollingPaper(Long userId, String slug) {
        RollingPaper paper = rollingPaperRepository.findBySlug(slug)
                .orElseThrow(() -> new CustomException(ErrorCode.ROLLING_PAPER_NOT_FOUND));

        if (!paper.getIsSavedCopy()) {
            throw new CustomException(ErrorCode.ROLLING_PAPER_NOT_FOUND);
        }

        boolean isSaver = paper.getSavedByUser() != null
                && paper.getSavedByUser().getId().equals(userId);
        if (!isSaver) {
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

    // POST /api/rolling-papers/{slug}/save - 롤링페이퍼 독립 복사본 저장
    // 소유자(CREATED) 또는 viewToken 소지자(RECEIVED)만 가능. commentToken 소지자는 403.
    @Transactional
    public RollingPaperSaveResponse saveRollingPaper(Long userId, String slug, String token) {
        RollingPaper original = rollingPaperRepository.findBySlug(slug)
                .orElseThrow(() -> new CustomException(ErrorCode.ROLLING_PAPER_NOT_FOUND));

        if (original.getIsSavedCopy()) {
            throw new CustomException(ErrorCode.ROLLING_PAPER_NOT_FOUND);
        }

        boolean isOwner = original.getUser().getId().equals(userId);
        String saveSource;

        if (isOwner) {
            saveSource = "CREATED";
        } else {
            boolean hasViewToken = token != null && token.equals(original.getViewToken());
            boolean hasCommentToken = token != null && token.equals(original.getCommentToken());
            if (hasCommentToken) {
                throw new CustomException(ErrorCode.ROLLING_PAPER_SAVE_FORBIDDEN);
            }
            if (!hasViewToken) {
                throw new CustomException(ErrorCode.ROLLING_PAPER_SAVE_FORBIDDEN);
            }
            saveSource = "RECEIVED";
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
                .isCommentPublic(original.getIsCommentPublic())
                .commentToken(null)
                .viewToken(null)
                .isSavedCopy(true)
                .savedByUser(saver)
                .saveSource(saveSource)
                .build();
        RollingPaper savedCopy = rollingPaperRepository.save(copy);

        // 댓글 복사 (비밀번호 제외 — 저장본에서는 수정/삭제 불필요)
        for (RollingPaperComment c : rollingPaperCommentRepository.findAllByRollingPaper(original)) {
            rollingPaperCommentRepository.save(RollingPaperComment.builder()
                    .rollingPaper(savedCopy)
                    .user(c.getUser())
                    .isUser(c.getIsUser())
                    .senderName(c.getSenderName())
                    .content(c.getContent())
                    .stickerKey(c.getStickerKey())
                    .slotIndex(c.getSlotIndex())
                    .guestPassword(null)
                    .build());
        }

        LocalDateTime savedAt = savedCopy.getCreatedAt() != null
                ? savedCopy.getCreatedAt() : java.time.LocalDateTime.now();
        return RollingPaperSaveResponse.of(savedCopy.getSlug(), saveSource, savedAt);
    }

    // GET /api/rolling-papers/me/saved - 내가 저장한 롤링페이퍼 복사본 목록
    public RollingPaperSavedListResponse getMySavedRollingPapers(Long userId) {
        List<RollingPaperSavedItemResponse> items = rollingPaperRepository
                .findAllBySavedByUser_IdAndIsSavedCopyTrueOrderByCreatedAtDesc(userId)
                .stream()
                .map(RollingPaperSavedItemResponse::from)
                .collect(Collectors.toList());
        return RollingPaperSavedListResponse.of(items);
    }
}
