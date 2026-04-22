package com.ssafy.oh_jjeom_oh.domain.board.repository;

import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import com.ssafy.oh_jjeom_oh.domain.board.entity.WishItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WishItemRepository extends JpaRepository<WishItem, Long> {

    List<WishItem> findByBoardOrderBySlotIndex(WishBoard board);

    Optional<WishItem> findByBoardAndSlotIndex(WishBoard board, Integer slotIndex);

    boolean existsByBoardAndSlotIndex(WishBoard board, Integer slotIndex);
}
