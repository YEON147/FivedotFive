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

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        User admin = userRepository.findByUsername(adminUsername)
                .map(existing -> {
                    if (existing.getRole() != Role.ADMIN) {
                        log.info("[AdminInit] 관리자 계정 role 보정: {} → ADMIN", existing.getRole());
                        existing.promoteToAdmin();
                    }
                    return existing;
                })
                .orElseGet(() -> {
                    log.info("[AdminInit] 관리자 계정 생성: username={}", adminUsername);
                    return userRepository.save(User.builder()
                            .username(adminUsername)
                            .passwordHash(passwordEncoder.encode(adminPassword))
                            .nickname(adminNickname)
                            .role(Role.ADMIN)
                            .build());
                });

        wishBoardRepository.findByUser(admin).ifPresentOrElse(
                board -> {
                    if (!adminUsername.equals(board.getBoardSlug())) {
                        log.info("[AdminInit] 관리자 보드 슬러그 보정: {} → {}", board.getBoardSlug(), adminUsername);
                        board.updateBoardSlug(adminUsername);
                    }
                },
                () -> {
                    log.info("[AdminInit] 관리자 보드 생성: slug={}", adminUsername);
                    wishBoardRepository.save(WishBoard.builder()
                            .user(admin)
                            .boardSlug(adminUsername)
                            .isPublic(true)
                            .build());
                }
        );
    }
}
