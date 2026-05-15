package com.ssafy.oh_jjeom_oh.domain.share.repository;

import com.ssafy.oh_jjeom_oh.domain.share.entity.ShareLink;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ShareLinkRepository extends JpaRepository<ShareLink, Long> {

    Optional<ShareLink> findByShortCode(String shortCode);

    boolean existsByShortCode(String shortCode);
}
