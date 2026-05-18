package com.ssafy.oh_jjeom_oh.domain.share.repository;

import com.ssafy.oh_jjeom_oh.domain.share.entity.ShareLink;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ShareLinkRepository extends JpaRepository<ShareLink, Long> {

    Optional<ShareLink> findByShortCode(String shortCode);

    boolean existsByShortCode(String shortCode);

    /** 동일 대상(originalUrl)에 대해 가장 먼저 만든 단축 링크 1건 (고정 slug 유지용) */
    Optional<ShareLink> findFirstByOriginalUrlOrderByIdAsc(String originalUrl);
}
