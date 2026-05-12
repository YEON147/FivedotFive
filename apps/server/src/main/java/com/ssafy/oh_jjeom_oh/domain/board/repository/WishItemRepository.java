package com.ssafy.oh_jjeom_oh.domain.board.repository;

import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import com.ssafy.oh_jjeom_oh.domain.board.entity.WishItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WishItemRepository extends JpaRepository<WishItem, Long> {

    List<WishItem> findByBoardOrderBySlotIndex(WishBoard board);

    Optional<WishItem> findByBoardAndSlotIndex(WishBoard board, Integer slotIndex);

    boolean existsByBoardAndSlotIndex(WishBoard board, Integer slotIndex);

    // 위시보드 단건 삭제 시 사용
    @Modifying
    @Query("delete from WishItem i where i.board = :board")
    void deleteByBoard(@Param("board") WishBoard board);

    @Modifying
    @Query("delete from WishItem i where i.board.id = (select b.id from WishBoard b where b.user.id = :userId)")
    void deleteByUserId(@Param("userId") Long userId);
}
