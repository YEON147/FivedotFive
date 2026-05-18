package com.ssafy.oh_jjeom_oh.domain.share.repository;

import com.ssafy.oh_jjeom_oh.domain.share.entity.ShareLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ShareLinkRepository extends JpaRepository<ShareLink, Long> {

    Optional<ShareLink> findByShortCode(String shortCode);

    boolean existsByShortCode(String shortCode);

    /** 동일 대상(originalUrl)에 대해 가장 먼저 만든 단축 링크 1건 (고정 slug 유지용) */
    Optional<ShareLink> findFirstByOriginalUrlOrderByIdAsc(String originalUrl);

    /**
     * 동일 롤링페이퍼 슬러그의 댓글용 단축(이전 token)만 제거하고, 저장 전용(view_token) 목적지는 둡니다.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM ShareLink s WHERE s.originalUrl LIKE CONCAT(:prefix, '%') AND s.originalUrl <> :excludedViewUrl")
    void deleteCommentShareDestinationsForSlug(@Param("prefix") String prefix, @Param("excludedViewUrl") String excludedViewUrl);
}
