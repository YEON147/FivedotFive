package com.ssafy.oh_jjeom_oh.domain.share.service;

import com.ssafy.oh_jjeom_oh.common.exception.CustomException;
import com.ssafy.oh_jjeom_oh.common.exception.ErrorCode;
import com.ssafy.oh_jjeom_oh.common.util.SlugGenerator;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishBoardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class ShareService {

    private static final String KEY_PREFIX = "share:";
    private static final long TTL_DAYS = 30;

    private static final String UTM_PARAMS =
            "?utm_source=user_share&utm_medium=referral&utm_campaign=wishlist_sharing";

    private final WishBoardRepository wishBoardRepository;
    private final RedisTemplate<String, String> redisTemplate;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public String generateShareLink(Long userId, String slug) {
        var board = wishBoardRepository.findByBoardSlug(slug)
                .orElseThrow(() -> new CustomException(ErrorCode.BOARD_NOT_FOUND));

        if (!board.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.BOARD_SHARE_FORBIDDEN);
        }

        String originalUrl = frontendUrl + "/wishlist/" + slug + UTM_PARAMS;

        ZoneId kst = ZoneId.of("Asia/Seoul");
        long ttlSeconds;
        if (board.getTargetDate() != null) {
            LocalDateTime expiresAt = board.getTargetDate().atStartOfDay(kst).toLocalDateTime();
            ttlSeconds = ChronoUnit.SECONDS.between(LocalDateTime.now(kst), expiresAt);
            if (ttlSeconds <= 0) ttlSeconds = 60;
        } else {
            ttlSeconds = TTL_DAYS * 24 * 60 * 60;
        }

        String shortCode;
        do {
            shortCode = SlugGenerator.generate();
        } while (Boolean.TRUE.equals(redisTemplate.hasKey(KEY_PREFIX + shortCode)));

        redisTemplate.opsForValue().set(KEY_PREFIX + shortCode, originalUrl, ttlSeconds, TimeUnit.SECONDS);

        return frontendUrl + "/share/" + shortCode;
    }

    /**
     * 롤링페이퍼 단축 공유 링크 생성.
     * targetDate 자정(KST)까지 유효 → expiresAt 반환.
     */
    public String generateRollingPaperShareLink(String slug, String token, LocalDate targetDate) {
        String originalUrl = frontendUrl + "/rolling-papers/" + slug + "?token=" + token;

        ZoneId kst = ZoneId.of("Asia/Seoul");
        LocalDateTime expiresAt = targetDate.atStartOfDay(kst).toLocalDateTime();
        long ttlSeconds = ChronoUnit.SECONDS.between(LocalDateTime.now(kst), expiresAt);
        if (ttlSeconds <= 0) ttlSeconds = 60;

        String shortCode;
        do {
            shortCode = SlugGenerator.generate();
        } while (Boolean.TRUE.equals(redisTemplate.hasKey(KEY_PREFIX + shortCode)));

        redisTemplate.opsForValue().set(KEY_PREFIX + shortCode, originalUrl, ttlSeconds, TimeUnit.SECONDS);
        return frontendUrl + "/share/" + shortCode;
    }

    public LocalDateTime rollingPaperExpiresAt(LocalDate targetDate) {
        return targetDate.atStartOfDay(ZoneId.of("Asia/Seoul")).toLocalDateTime();
    }

    public String resolveShortCode(String shortCode) {
        String originalUrl = redisTemplate.opsForValue().get(KEY_PREFIX + shortCode);
        if (originalUrl == null) {
            throw new CustomException(ErrorCode.SHARE_LINK_NOT_FOUND);
        }
        return originalUrl;
    }
}
