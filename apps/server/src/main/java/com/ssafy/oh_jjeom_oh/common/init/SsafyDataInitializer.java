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
            // 15기 대전 반별 계정
            new ClassInfo("ssafy15dj1", "15대전1반", "ssafy15dj1", "ssafy-15-dj-1", "15기대전1반", "15기 대전 1반"),
            new ClassInfo("ssafy15dj2", "15대전2반", "ssafy15dj2", "ssafy-15-dj-2", "15기대전2반", "15기 대전 2반"),
            new ClassInfo("ssafy15dj3", "15대전3반", "ssafy15dj3", "ssafy-15-dj-3", "15기대전3반", "15기 대전 3반"),
            new ClassInfo("ssafy15dj4", "15대전4반", "ssafy15dj4", "ssafy-15-dj-4", "15기대전4반", "15기 대전 4반"),
            new ClassInfo("ssafy15dj5", "15대전5반", "ssafy15dj5", "ssafy-15-dj-5", "15기대전5반", "15기 대전 5반"),
            new ClassInfo("ssafy15dj6", "15대전6반", "ssafy15dj6", "ssafy-15-dj-6", "15기대전6반", "15기 대전 6반"),
            // 14기 대전 컨설턴트
            new ClassInfo("ssafy14dj1", "14대전1반", "ssafy14dj1", "ssafy-14-dj-1", "14기대전1반", "고성현"),
            new ClassInfo("ssafy14dj2", "14대전2반", "ssafy14dj2", "ssafy-14-dj-2", "14기대전2반", "한기철"),
            // 프로님
            new ClassInfo("sonjongmin",  "손종민프로",  "sonjongmin",  "son-jong-min",   "손종민 프로님",  "손종민 프로님"),
            new ClassInfo("jangnhyeon",  "장나현프로",  "jangnhyeon",  "jang-na-hyeon",  "장나현 프로님",  "장나현 프로님"),
            new ClassInfo("leejeonggi",  "이정길프로",  "leejeonggi",  "lee-jeong-gil",  "이정길 프로님",  "이정길 프로님"),
            new ClassInfo("jeonhiyeon",  "전희연프로",  "jeonhiyeon",  "jeon-hui-yeon",  "전희연 프로님",  "전희연 프로님"),
            new ClassInfo("hongeunhye",  "홍은혜프로",  "hongeunhye",  "hong-eun-hye",   "홍은혜 프로님",  "홍은혜 프로님"),
            new ClassInfo("ohyonghun",   "오용훈프로",  "ohyonghun",   "oh-yong-hun",    "오용훈 프로님",  "오용훈 프로님"),
            // 코치님
            new ClassInfo("jeonahyeon",  "전아현코치",  "jeonahyeon",  "jeon-ah-hyeon",  "전아현 코치님",  "전아현 코치님"),
            new ClassInfo("kimdohun",    "김도훈코치",  "kimdohun",    "kim-do-hun",     "김도훈 코치님",  "김도훈 코치님"),
            new ClassInfo("yooseungh",   "유승현코치",  "yooseungh",   "yoo-seung-hyun", "유승현 코치님",  "유승현 코치님"),
            new ClassInfo("leeunghee",   "이웅희코치",  "leeunghee",   "lee-ung-hee",    "이웅희 코치님",  "이웅희 코치님")
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
        rollingPaperRepository.findBySlug(info.slug()).ifPresentOrElse(
                paper -> {
                    // recipient_name이 다르면 보정
                    if (!info.recipientName().equals(paper.getRecipientName())) {
                        log.info("[SsafyInit] recipient_name 보정: slug={}, {} → {}",
                                info.slug(), paper.getRecipientName(), info.recipientName());
                        paper.updateRecipientName(info.recipientName());
                    } else {
                        log.debug("[SsafyInit] 롤링페이퍼 이미 존재: slug={}", info.slug());
                    }
                },
                () -> {
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
        );
    }
}
