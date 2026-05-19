package com.ssafy.oh_jjeom_oh.common.init;

import com.ssafy.oh_jjeom_oh.domain.rollingpaper.entity.RollingPaper;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.repository.RollingPaperRepository;
import com.ssafy.oh_jjeom_oh.domain.share.entity.ShareLink;
import com.ssafy.oh_jjeom_oh.domain.share.repository.ShareLinkRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * 공지 문서에 기재된 단축 코드와 SSAFY 롤링페이퍼(댓글용 token) 목적지를 맞춥니다.
 * {@link SsafyDataInitializer} 이후(Order 4) 실행됩니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Order(4)
public class SsafyPublicShareLinkInitializer implements ApplicationRunner {

    /** slug → 공지용 short_code (프로덕션 공지와 동일) */
    private static final Map<String, String> ANNOUNCED_SHORT_CODE_BY_SLUG = Map.ofEntries(
            Map.entry("son-jong-min", "9z0xn3vuqt"),
            Map.entry("jang-na-hyeon", "f6sv08uotm"),
            Map.entry("lee-jeong-gil", "0949h5rjwr"),
            Map.entry("hong-eun-hye", "6svjd758pp"),
            Map.entry("oh-yong-hun", "h50bvt18gm"),
            Map.entry("heo-su-min", "rw2e9124pa"),
            Map.entry("jeon-ah-hyeon", "vj90r401q2"),
            Map.entry("kim-do-hun", "kgi7ckusj3"),
            Map.entry("yoo-seung-hyun", "5c6yd8miva"),
            Map.entry("lee-ung-hee", "nshd47ij9r"),
            Map.entry("ssafy-14-dj-1", "72j8yfcmwf"),
            Map.entry("ssafy-14-dj-2", "ff8z492519"),
            Map.entry("ssafy-15-dj-1", "2hjyzvzhda"),
            Map.entry("ssafy-15-dj-2", "fcyj5a5v76"),
            Map.entry("ssafy-15-dj-3", "ijuxmldqgz"),
            Map.entry("ssafy-15-dj-4", "uql7dtsxzx"),
            Map.entry("ssafy-15-dj-5", "2gi6f8j058"),
            Map.entry("ssafy-15-dj-6", "zlvdb61fjc")
    );

    private final RollingPaperRepository rollingPaperRepository;
    private final ShareLinkRepository shareLinkRepository;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (Map.Entry<String, String> e : ANNOUNCED_SHORT_CODE_BY_SLUG.entrySet()) {
            String slug = e.getKey();
            String shortCode = e.getValue();
            RollingPaper paper = rollingPaperRepository.findBySlug(slug).orElse(null);
            if (paper == null || Boolean.TRUE.equals(paper.getIsSavedCopy())) {
                log.warn("[SsafyShare] 롤링페이퍼 없음 또는 복사본: slug={}", slug);
                continue;
            }
            String commentToken = paper.getCommentToken();
            String viewToken = paper.getViewToken();
            if (commentToken == null || viewToken == null) {
                log.warn("[SsafyShare] comment_token/view_token 없음: slug={}", slug);
                continue;
            }
            String originalUrl = frontendUrl + "/rolling-papers/" + slug + "?token=" + commentToken;
            String viewOriginalUrl = frontendUrl + "/rolling-papers/" + slug + "?token=" + viewToken;
            String urlPrefix = frontendUrl + "/rolling-papers/" + slug + "?token=";

            shareLinkRepository.deleteCommentShareDestinationsForSlug(urlPrefix, viewOriginalUrl);
            shareLinkRepository.findByShortCode(shortCode).ifPresent(shareLinkRepository::delete);

            shareLinkRepository.save(ShareLink.builder()
                    .shortCode(shortCode)
                    .originalUrl(originalUrl)
                    .build());
            log.info("[SsafyShare] 공지 단축 맞춤: /share/{} → {}", shortCode, originalUrl);
        }
    }
}
