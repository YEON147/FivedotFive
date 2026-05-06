package com.ssafy.oh_jjeom_oh.domain.share.service;

import com.ssafy.oh_jjeom_oh.common.exception.CustomException;
import com.ssafy.oh_jjeom_oh.common.exception.ErrorCode;
import com.ssafy.oh_jjeom_oh.common.util.SlugGenerator;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishBoardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

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

    public String generateShareLink(Long userId) {
        String slug = wishBoardRepository.findFirstByUser_Id(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.BOARD_NOT_FOUND))
                .getBoardSlug();

        String originalUrl = frontendUrl + "/wishlist/" + slug + UTM_PARAMS;

        String shortCode;
        do {
            shortCode = SlugGenerator.generate();
        } while (Boolean.TRUE.equals(redisTemplate.hasKey(KEY_PREFIX + shortCode)));

        redisTemplate.opsForValue().set(KEY_PREFIX + shortCode, originalUrl, TTL_DAYS, TimeUnit.DAYS);

        return frontendUrl + "/share/" + shortCode;
    }

    public String resolveShortCode(String shortCode) {
        String originalUrl = redisTemplate.opsForValue().get(KEY_PREFIX + shortCode);
        if (originalUrl == null) {
            throw new CustomException(ErrorCode.SHARE_LINK_NOT_FOUND);
        }
        return originalUrl;
    }
}
