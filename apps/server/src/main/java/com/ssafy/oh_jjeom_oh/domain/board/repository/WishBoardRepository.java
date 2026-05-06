package com.ssafy.oh_jjeom_oh.domain.board.repository;

import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import com.ssafy.oh_jjeom_oh.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WishBoardRepository extends JpaRepository<WishBoard, Long> {

    Optional<WishBoard> findByBoardSlug(String boardSlug);

    // 단일 보드 조회 (어드민/팀 계정용 - 보드가 한 개인 경우)
    Optional<WishBoard> findFirstByUser(User user);

    Optional<WishBoard> findFirstByUser_Id(Long userId);

    // 다중 보드 조회 (사용자 보드 목록)
    List<WishBoard> findAllByUser_IdOrderByCreatedAtDesc(Long userId);

    boolean existsByUser(User user);

    boolean existsByUser_Id(Long userId);

    boolean existsByBoardSlug(String boardSlug);

    // 사용자의 전체 위시보드 + 롤링페이퍼 합산 개수 (Stage 2에서 롤링페이퍼 포함)
    long countByUser_Id(Long userId);

    @Modifying
    @Query("delete from WishBoard b where b.user.id = :userId")
    void deleteByUser_Id(@Param("userId") Long userId);
}
