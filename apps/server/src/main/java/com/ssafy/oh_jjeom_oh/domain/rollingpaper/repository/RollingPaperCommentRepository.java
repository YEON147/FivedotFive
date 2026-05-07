package com.ssafy.oh_jjeom_oh.domain.rollingpaper.repository;

import com.ssafy.oh_jjeom_oh.domain.rollingpaper.entity.RollingPaper;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.entity.RollingPaperComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RollingPaperCommentRepository extends JpaRepository<RollingPaperComment, Long> {

    Page<RollingPaperComment> findByRollingPaperOrderBySlotIndexAsc(RollingPaper rollingPaper, Pageable pageable);

    long countByRollingPaper(RollingPaper rollingPaper);

    // 롤링페이퍼 복사 시 전체 댓글 조회
    List<RollingPaperComment> findAllByRollingPaper(RollingPaper rollingPaper);

    // 롤링페이퍼 단건 삭제 시 사용
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("delete from RollingPaperComment c where c.rollingPaper = :paper")
    void deleteByRollingPaper(@org.springframework.data.repository.query.Param("paper") RollingPaper paper);

    /**
     * 소프트 딜리트된 댓글 포함, (rolling_paper_id, slot_index)만으로 존재 여부 확인.
     * 향후 @Where 필터 추가 시에도 안전하게 동작하도록 네이티브 쿼리 사용.
     */
    @Query(value = "SELECT COUNT(*) > 0 FROM rolling_paper_comments WHERE rolling_paper_id = :paperId AND slot_index = :slotIndex", nativeQuery = true)
    boolean existsByPaperIdAndSlotIndexNative(@Param("paperId") Long paperId, @Param("slotIndex") Integer slotIndex);
}
