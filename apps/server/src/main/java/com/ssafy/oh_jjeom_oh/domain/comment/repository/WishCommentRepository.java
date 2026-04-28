package com.ssafy.oh_jjeom_oh.domain.comment.repository;

import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import com.ssafy.oh_jjeom_oh.domain.comment.entity.WishComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WishCommentRepository extends JpaRepository<WishComment, Long> {

    Page<WishComment> findByWishBoardOrderBySlotIndexAsc(WishBoard wishBoard, Pageable pageable);

    long countByWishBoard(WishBoard wishBoard);

    /**
     * 소프트 딜리트된 댓글 포함, 순수하게 (wish_list_id, slot_index)만으로 존재 여부 확인.
     * JPA 파생 쿼리는 향후 @Where 같은 필터가 추가될 경우 삭제된 행을 제외할 수 있으므로
     * 네이티브 쿼리로 직접 조회한다.
     */
    @Query(value = "SELECT COUNT(*) > 0 FROM wish_comments WHERE wish_list_id = :boardId AND slot_index = :slotIndex", nativeQuery = true)
    boolean existsByBoardIdAndSlotIndexNative(@Param("boardId") Long boardId, @Param("slotIndex") Integer slotIndex);

    void deleteByWishBoard(WishBoard wishBoard);
}
