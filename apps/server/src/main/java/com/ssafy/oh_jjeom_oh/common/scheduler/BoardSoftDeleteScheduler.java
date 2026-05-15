package com.ssafy.oh_jjeom_oh.common.scheduler;

import com.ssafy.oh_jjeom_oh.domain.asset.repository.BoardAssetRepository;
import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishBoardRepository;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishItemRepository;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.entity.RollingPaper;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.repository.RollingPaperRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

/**
 * targetDate 가 지난 원본 위시보드·롤링페이퍼를 매일 자정(KST)에 hard-delete 처리.
 * 이미 저장된 독립 복사본은 영향 없음.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BoardSoftDeleteScheduler {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final WishBoardRepository wishBoardRepository;
    private final WishItemRepository wishItemRepository;
    private final BoardAssetRepository boardAssetRepository;
    private final RollingPaperRepository rollingPaperRepository;
    private final Clock clock;

    @Scheduled(cron = "0 0 0 * * *", zone = "Asia/Seoul")
    @Transactional
    public void softDeleteExpiredBoards() {
        LocalDate today = clock.instant().atZone(KST).toLocalDate();

        List<WishBoard> expiredBoards =
                wishBoardRepository.findAllByTargetDateBeforeAndIsSavedCopyFalse(today);
        for (WishBoard board : expiredBoards) {
            // wish_comments.wish_list_id FK가 SET NULL이므로 댓글을 직접 삭제하지 않음 (랭킹 집계 보존)
            wishItemRepository.deleteByBoard(board);
            boardAssetRepository.deleteByBoard(board);
            wishBoardRepository.delete(board);
        }

        List<RollingPaper> expiredPapers =
                rollingPaperRepository.findAllByTargetDateBeforeAndIsSavedCopyFalse(today);
        for (RollingPaper paper : expiredPapers) {
            // rolling_paper_comments.rolling_paper_id FK가 SET NULL이므로 댓글을 직접 삭제하지 않음 (랭킹 집계 보존)
            rollingPaperRepository.delete(paper);
        }

        log.info("[BoardSoftDeleteScheduler] 위시보드 {}개, 롤링페이퍼 {}개 hard-delete 완료 (기준일: {})",
                expiredBoards.size(), expiredPapers.size(), today);
    }
}
