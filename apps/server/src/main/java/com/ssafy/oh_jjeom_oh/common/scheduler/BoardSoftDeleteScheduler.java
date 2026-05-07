package com.ssafy.oh_jjeom_oh.common.scheduler;

import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishBoardRepository;
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
 * targetDate 가 지난 원본 위시보드·롤링페이퍼를 매일 자정(KST)에 soft-delete 처리.
 * soft-delete 된 원본은 새 조회 API에서 제외되며, 이미 저장된 복사본에는 영향 없음.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BoardSoftDeleteScheduler {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final WishBoardRepository wishBoardRepository;
    private final RollingPaperRepository rollingPaperRepository;
    private final Clock clock;

    @Scheduled(cron = "0 0 0 * * *", zone = "Asia/Seoul")
    @Transactional
    public void softDeleteExpiredBoards() {
        LocalDate today = clock.instant().atZone(KST).toLocalDate();

        List<WishBoard> expiredBoards =
                wishBoardRepository.findAllByTargetDateBeforeAndIsSavedCopyFalseAndDeletedAtIsNull(today);
        expiredBoards.forEach(WishBoard::softDelete);

        List<RollingPaper> expiredPapers =
                rollingPaperRepository.findAllByTargetDateBeforeAndIsSavedCopyFalseAndDeletedAtIsNull(today);
        expiredPapers.forEach(RollingPaper::softDelete);

        log.info("[BoardSoftDeleteScheduler] 위시보드 {}개, 롤링페이퍼 {}개 soft-delete 완료 (기준일: {})",
                expiredBoards.size(), expiredPapers.size(), today);
    }
}
