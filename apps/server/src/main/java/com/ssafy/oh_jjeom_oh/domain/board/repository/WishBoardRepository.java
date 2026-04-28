package com.ssafy.oh_jjeom_oh.domain.board.repository;

import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import com.ssafy.oh_jjeom_oh.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WishBoardRepository extends JpaRepository<WishBoard, Long> {

    Optional<WishBoard> findByBoardSlug(String boardSlug);

    Optional<WishBoard> findByUser(User user);

    Optional<WishBoard> findByUser_Id(Long userId);

    boolean existsByUser(User user);

    boolean existsByUser_Id(Long userId);

    boolean existsByBoardSlug(String boardSlug);

    void deleteByUser_Id(Long userId);
}
