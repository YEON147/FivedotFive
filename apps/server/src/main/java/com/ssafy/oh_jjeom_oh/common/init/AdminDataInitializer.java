package com.ssafy.oh_jjeom_oh.common.init;

import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishBoardRepository;
import com.ssafy.oh_jjeom_oh.domain.user.entity.User;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Role;
import com.ssafy.oh_jjeom_oh.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 서버 시작 시 관리자 계정과 보드를 자동으로 생성/보정합니다.
 * - 계정이 없으면 생성 (환경변수 ADMIN_PASSWORD 필수)
 * - 보드가 없으면 slug=adminUsername 으로 생성
 * - 보드가 있지만 slug가 다르면 보정
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminDataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final WishBoardRepository wishBoardRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.username}")
    private String adminUsername;

    @Value("${admin.password}")
    private String adminPassword;

    @Value("${admin.nickname}")
    private String adminNickname;

    @Value("${admin2.username:}")
    private String admin2Username;

    @Value("${admin2.password:}")
    private String admin2Password;

    @Value("${admin2.nickname:오쩜오2}")
    private String admin2Nickname;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        ensureAdminAccount(adminUsername, adminPassword, adminNickname, true);

        // ADMIN2_USERNAME, ADMIN2_PASSWORD 환경변수가 모두 설정된 경우에만 처리
        if (!admin2Username.isBlank() && !admin2Password.isBlank()) {
            ensureAdminAccount(admin2Username, admin2Password, admin2Nickname, false);
        }
    }

    private void ensureAdminAccount(String username, String password, String nickname, boolean boardPublic) {
        User admin = userRepository.findByUsername(username)
                .map(existing -> {
                    if (existing.getRole() != Role.ADMIN) {
                        log.info("[AdminInit] 관리자 계정 role 보정: {} → ADMIN", existing.getRole());
                        existing.promoteToAdmin();
                    }
                    return existing;
                })
                .orElseGet(() -> {
                    log.info("[AdminInit] 관리자 계정 생성: username={}", username);
                    return userRepository.save(User.builder()
                            .username(username)
                            .passwordHash(passwordEncoder.encode(password))
                            .nickname(nickname)
                            .role(Role.ADMIN)
                            .build());
                });

        wishBoardRepository.findByBoardSlug(username).ifPresentOrElse(
                board -> {
                    if (!Boolean.valueOf(boardPublic).equals(board.getIsPublic())) {
                        log.info("[AdminInit] 관리자 보드 공개 여부 보정: {} → {}", board.getIsPublic(), boardPublic);
                        board.updateIsPublic(boardPublic);
                    }
                },
                () -> {
                    log.info("[AdminInit] 관리자 보드 생성: slug={}, isPublic={}", username, boardPublic);
                    wishBoardRepository.save(WishBoard.builder()
                            .user(admin)
                            .boardSlug(username)
                            .isPublic(boardPublic)
                            .build());
                }
        );
    }
}
