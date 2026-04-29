package com.ssafy.oh_jjeom_oh.domain.notice.repository;

import com.ssafy.oh_jjeom_oh.domain.notice.entity.Notice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface NoticeRepository extends JpaRepository<Notice, Long> {

    // 노출 기간 내 공지 조회 (isPinned 우선, 이후 startAt 최신순)
    @Query("SELECT n FROM Notice n WHERE :now BETWEEN n.startAt AND n.endAt ORDER BY n.isPinned DESC, n.startAt DESC")
    List<Notice> findActiveNotices(@Param("now") LocalDateTime now);

    // 전체 조회 (ADMIN용, isPinned 우선, startAt 최신순)
    List<Notice> findAllByOrderByIsPinnedDescStartAtDesc();

    // 노출 기간 내 배너 조회 (bannerText 있는 것만, isPinned 우선)
    @Query("SELECT n FROM Notice n WHERE :now BETWEEN n.startAt AND n.endAt AND n.bannerText IS NOT NULL ORDER BY n.isPinned DESC, n.startAt DESC")
    List<Notice> findActiveBanners(@Param("now") LocalDateTime now);
}
