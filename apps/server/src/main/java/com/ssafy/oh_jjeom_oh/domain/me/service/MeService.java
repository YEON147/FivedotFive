package com.ssafy.oh_jjeom_oh.domain.me.service;

import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishBoardRepository;
import com.ssafy.oh_jjeom_oh.domain.me.dto.response.BoardSummaryResponse;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.entity.RollingPaper;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.repository.RollingPaperRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MeService {

    private final WishBoardRepository wishBoardRepository;
    private final RollingPaperRepository rollingPaperRepository;

    // GET /api/me/boards-all - 위시보드 + 롤링페이퍼 원본 통합 목록 (최신순)
    public List<BoardSummaryResponse> getBoardsAll(Long userId) {
        List<WishBoard> boards =
                wishBoardRepository.findAllByUser_IdAndIsSavedCopyFalseOrderByCreatedAtDesc(userId);
        List<RollingPaper> papers =
                rollingPaperRepository.findAllByUser_IdAndIsSavedCopyFalseOrderByCreatedAtDesc(userId);

        List<BoardSummaryResponse> result = new ArrayList<>();
        boards.forEach(b -> result.add(BoardSummaryResponse.fromWishBoard(b)));
        papers.forEach(p -> result.add(BoardSummaryResponse.fromRollingPaper(p)));

        result.sort(Comparator.comparing(BoardSummaryResponse::getCreatedAt,
                Comparator.nullsLast(Comparator.reverseOrder())));
        return result;
    }
}
