package com.ssafy.oh_jjeom_oh.domain.share.repository;

import com.ssafy.oh_jjeom_oh.domain.share.entity.ShareLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Optional;

public interface ShareLinkRepository extends JpaRepository<ShareLink, Long> {

    Optional<ShareLink> findByShortCode(String shortCode);

    boolean existsByShortCode(String shortCode);

    @Modifying
    @Query("DELETE FROM ShareLink s WHERE s.expiresAt < :now")
    int deleteAllExpiredBefore(LocalDateTime now);
}
