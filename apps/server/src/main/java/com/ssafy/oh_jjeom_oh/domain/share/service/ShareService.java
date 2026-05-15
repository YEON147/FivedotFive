package com.ssafy.oh_jjeom_oh.domain.share.service;

import com.ssafy.oh_jjeom_oh.common.exception.CustomException;
import com.ssafy.oh_jjeom_oh.common.exception.ErrorCode;
import com.ssafy.oh_jjeom_oh.common.util.SlugGenerator;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishBoardRepository;
import com.ssafy.oh_jjeom_oh.domain.share.entity.ShareLink;
import com.ssafy.oh_jjeom_oh.domain.share.repository.ShareLinkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ShareService {

    private static final String UTM_PARAMS =
            "?utm_source=user_share&utm_medium=referral&utm_campaign=wishlist_sharing";

    private final WishBoardRepository wishBoardRepository;
    private final ShareLinkRepository shareLinkRepository;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Transactional
    public String generateShareLink(Long userId, String slug) {
        var board = wishBoardRepository.findByBoardSlug(slug)
                .orElseThrow(() -> new CustomException(ErrorCode.BOARD_NOT_FOUND));

        if (!board.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.BOARD_SHARE_FORBIDDEN);
        }

        String originalUrl = frontendUrl + "/wishlist/" + slug + UTM_PARAMS;
        String shortCode = generateUniqueShortCode();

        shareLinkRepository.save(ShareLink.builder()
                .shortCode(shortCode)
                .originalUrl(originalUrl)
                .build());

        return frontendUrl + "/share/" + shortCode;
    }

    @Transactional
    public String generateRollingPaperShareLink(String slug, String token, LocalDate targetDate) {
        String originalUrl = frontendUrl + "/rolling-papers/" + slug + "?token=" + token;
        String shortCode = generateUniqueShortCode();

        shareLinkRepository.save(ShareLink.builder()
                .shortCode(shortCode)
                .originalUrl(originalUrl)
                .build());

        return frontendUrl + "/share/" + shortCode;
    }

    public LocalDateTime rollingPaperExpiresAt(LocalDate targetDate) {
        return targetDate.atStartOfDay(java.time.ZoneId.of("Asia/Seoul")).toLocalDateTime();
    }

    @Transactional(readOnly = true)
    public String resolveShortCode(String shortCode) {
        ShareLink link = shareLinkRepository.findByShortCode(shortCode)
                .orElseThrow(() -> new CustomException(ErrorCode.SHARE_LINK_NOT_FOUND));

        return link.getOriginalUrl();
    }

    private String generateUniqueShortCode() {
        String shortCode;
        do {
            shortCode = SlugGenerator.generate();
        } while (shareLinkRepository.existsByShortCode(shortCode));
        return shortCode;
    }
}
