package com.ssafy.oh_jjeom_oh.common.init;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * SSAFY 기본 롤링페이퍼의 공유 토큰을 슬러그별로 고정합니다.
 * 공지에 실린 단축 URL이 리다이렉트되는 목적지({@code /rolling-papers/{slug}?token=...})와 항상 일치하도록 합니다.
 */
public final class SsafyRollingPaperTokens {

    private SsafyRollingPaperTokens() {}

    public static String commentTokenForSlug(String slug) {
        return deterministicUuidBytes("ohjjeomoh-ssafy-rp-cmt-" + slug);
    }

    public static String viewTokenForSlug(String slug) {
        return deterministicUuidBytes("ohjjeomoh-ssafy-rp-view-" + slug);
    }

    private static String deterministicUuidBytes(String seed) {
        return UUID.nameUUIDFromBytes(seed.getBytes(StandardCharsets.UTF_8))
                .toString()
                .replace("-", "");
    }
}
