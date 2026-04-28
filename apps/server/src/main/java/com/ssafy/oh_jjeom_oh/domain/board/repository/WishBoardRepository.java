package com.ssafy.oh_jjeom_oh.domain.board.repository;

import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import com.ssafy.oh_jjeom_oh.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface WishBoardRepository extends JpaRepository<WishBoard, Long> {

    Optional<WishBoard> findByBoardSlug(String boardSlug);

    Optional<WishBoard> findByUser(User user);

    Optional<WishBoard> findByUser_Id(Long userId);

    boolean existsByUser(User user);

    boolean existsByUser_Id(Long userId);

    boolean existsByBoardSlug(String boardSlug);

    @Modifying
    @Query("delete from WishBoard b where b.user.id = :userId")
    void deleteByUser_Id(@Param("userId") Long userId);
}
