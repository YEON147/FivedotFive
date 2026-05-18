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
        return getOrCreateShareUrl(originalUrl);
    }

    @Transactional
    public String generateRollingPaperShareLink(String slug, String token) {
        String originalUrl = frontendUrl + "/rolling-papers/" + slug + "?token=" + token;
        return getOrCreateShareUrl(originalUrl);
    }

    /**
     * 동일 {@code originalUrl}에 이미 공유 링크가 있으면 기존 shortCode로 URL 반환.
     * 없을 때만 새 레코드를 저장해 단축 slug가 매 요청마다 바뀌지 않도록 함.
     */
    private String getOrCreateShareUrl(String originalUrl) {
        return shareLinkRepository.findFirstByOriginalUrlOrderByIdAsc(originalUrl)
                .map(link -> frontendUrl + "/share/" + link.getShortCode())
                .orElseGet(() -> {
                    String shortCode = generateUniqueShortCode();
                    shareLinkRepository.save(ShareLink.builder()
                            .shortCode(shortCode)
                            .originalUrl(originalUrl)
                            .build());
                    return frontendUrl + "/share/" + shortCode;
                });
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
