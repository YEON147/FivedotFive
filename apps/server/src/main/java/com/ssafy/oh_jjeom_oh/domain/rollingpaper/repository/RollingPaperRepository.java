package com.ssafy.oh_jjeom_oh.domain.rollingpaper.repository;

import com.ssafy.oh_jjeom_oh.domain.rollingpaper.entity.RollingPaper;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RollingPaperRepository extends JpaRepository<RollingPaper, Long> {

    Optional<RollingPaper> findBySlug(String slug);

    boolean existsBySlug(String slug);

    // 내가 만든 롤링페이퍼 목록 (원본만, 최신순)
    List<RollingPaper> findAllByUser_IdAndIsSavedCopyFalseOrderByCreatedAtDesc(Long userId);

    // 내가 저장한 롤링페이퍼 복사본 목록 (최신순)
    List<RollingPaper> findAllBySavedByUser_IdAndIsSavedCopyTrueOrderByCreatedAtDesc(Long userId);

    // 사용자의 원본 롤링페이퍼 개수 (생성 수 제한 체크)
    long countByUser_IdAndIsSavedCopyFalse(Long userId);

    boolean existsByCommentToken(String commentToken);

    boolean existsByViewToken(String viewToken);

    Optional<RollingPaper> findByCommentToken(String commentToken);

    Optional<RollingPaper> findByViewToken(String viewToken);
}
