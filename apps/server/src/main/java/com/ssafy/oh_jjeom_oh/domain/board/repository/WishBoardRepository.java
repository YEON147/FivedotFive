package com.ssafy.oh_jjeom_oh.domain.board.repository;

import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import com.ssafy.oh_jjeom_oh.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
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

    // 사용자의 전체 위시보드 개수 (원본 + 복사본 합산)
    long countByUser_Id(Long userId);

    // 사용자의 원본 위시보드 개수 (생성 개수 제한 체크용)
    long countByUser_IdAndIsSavedCopyFalse(Long userId);

    // 내가 저장한 복사본 목록 (최신순)
    List<WishBoard> findAllBySavedByUser_IdAndIsSavedCopyTrueOrderByCreatedAtDesc(Long savedByUserId);

    // 통합 목록용: 원본만, 최신순
    List<WishBoard> findAllByUser_IdAndIsSavedCopyFalseOrderByCreatedAtDesc(Long userId);

    // 가장 최근 원본 1개 (soft-delete 제외)
    Optional<WishBoard> findFirstByUser_IdAndIsSavedCopyFalseAndDeletedAtIsNullOrderByCreatedAtDesc(Long userId);

    // 스케줄러용: targetDate 경과 + 원본 + 미삭제
    List<WishBoard> findAllByTargetDateBeforeAndIsSavedCopyFalseAndDeletedAtIsNull(LocalDate date);

    @Modifying
    @Query("delete from WishBoard b where b.user.id = :userId")
    void deleteByUser_Id(@Param("userId") Long userId);
}
