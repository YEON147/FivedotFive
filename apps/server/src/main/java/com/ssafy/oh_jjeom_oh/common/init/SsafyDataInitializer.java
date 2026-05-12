package com.ssafy.oh_jjeom_oh.common.init;

import com.ssafy.oh_jjeom_oh.common.util.TokenGenerator;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.entity.RollingPaper;
import com.ssafy.oh_jjeom_oh.domain.rollingpaper.repository.RollingPaperRepository;
import com.ssafy.oh_jjeom_oh.domain.user.entity.User;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Provider;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Role;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Status;
import com.ssafy.oh_jjeom_oh.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * 서버 시작 시 SSAFY 반별 계정 및 롤링페이퍼를 자동으로 생성합니다.
 * - 계정·롤링페이퍼가 이미 존재하면 skip (멱등)
 * - TeamDataInitializer(@Order 2) 이후에 실행되도록 @Order(3) 지정
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Order(3)
public class SsafyDataInitializer implements ApplicationRunner {

    private static final String SHARED_PASSWORD = "SsafyDj26";
    private static final LocalDate TARGET_DATE   = LocalDate.of(2026, 5, 15);

    private record ClassInfo(String username, String nickname, String teamTag,
                             String slug, String title, String recipientName) {}

    private static final List<ClassInfo> SSAFY_CLASSES = List.of(
            new ClassInfo("ssafy15dj1", "15대전1반", "ssafy15dj1", "ssafy-15-dj-1", "15기대전1반", "15기 대전 1반"),
            new ClassInfo("ssafy15dj2", "15대전2반", "ssafy15dj2", "ssafy-15-dj-2", "15기대전2반", "15기 대전 2반"),
            new ClassInfo("ssafy15dj3", "15대전3반", "ssafy15dj3", "ssafy-15-dj-3", "15기대전3반", "15기 대전 3반"),
            new ClassInfo("ssafy15dj4", "15대전4반", "ssafy15dj4", "ssafy-15-dj-4", "15기대전4반", "15기 대전 4반"),
            new ClassInfo("ssafy15dj5", "15대전5반", "ssafy15dj5", "ssafy-15-dj-5", "15기대전5반", "15기 대전 5반"),
            new ClassInfo("ssafy15dj6", "15대전6반", "ssafy15dj6", "ssafy-15-dj-6", "15기대전6반", "15기 대전 6반"),
            new ClassInfo("ssafy14dj1", "14대전1반", "ssafy14dj1", "ssafy-14-dj-1", "14기대전1반", "14기 대전 1반"),
            new ClassInfo("ssafy14dj2", "14대전2반", "ssafy14dj2", "ssafy-14-dj-2", "14기대전2반", "14기 대전 2반")
    );

    private final UserRepository         userRepository;
    private final RollingPaperRepository rollingPaperRepository;
    private final PasswordEncoder        passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (ClassInfo info : SSAFY_CLASSES) {
            User user = ensureUser(info);
            ensureRollingPaper(user, info);
        }
    }

    private User ensureUser(ClassInfo info) {
        return userRepository.findByUsername(info.username()).orElseGet(() -> {
            log.info("[SsafyInit] SSAFY 반 계정 생성: username={}", info.username());
            User user = User.builder()
                    .username(info.username())
                    .passwordHash(passwordEncoder.encode(SHARED_PASSWORD))
                    .nickname(info.nickname())
                    .provider(Provider.LOCAL)
                    .role(Role.TEAM)
                    .teamTag(info.teamTag())
                    .status(Status.ACTIVE)
                    .build();
            return userRepository.save(user);
        });
    }

    private void ensureRollingPaper(User user, ClassInfo info) {
        if (rollingPaperRepository.existsBySlug(info.slug())) {
            log.debug("[SsafyInit] 롤링페이퍼 이미 존재: slug={}", info.slug());
            return;
        }

        String commentToken;
        do { commentToken = TokenGenerator.generate(); }
        while (rollingPaperRepository.existsByCommentToken(commentToken));

        String viewToken;
        do { viewToken = TokenGenerator.generate(); }
        while (rollingPaperRepository.existsByViewToken(viewToken));

        RollingPaper paper = RollingPaper.builder()
                .user(user)
                .slug(info.slug())
                .title(info.title())
                .recipientName(info.recipientName())
                .targetDate(TARGET_DATE)
                .isCommentPublic(false)
                .commentToken(commentToken)
                .viewToken(viewToken)
                .build();

        rollingPaperRepository.save(paper);
        log.info("[SsafyInit] 롤링페이퍼 생성: slug={}, title={}", info.slug(), info.title());
    }
}
