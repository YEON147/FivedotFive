package com.ssafy.oh_jjeom_oh.domain.comment.repository;

import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import com.ssafy.oh_jjeom_oh.domain.comment.entity.WishComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WishCommentRepository extends JpaRepository<WishComment, Long> {

    Page<WishComment> findByWishBoardOrderByCreatedAtDesc(WishBoard wishBoard, Pageable pageable);

    long countByWishBoard(WishBoard wishBoard);
}
