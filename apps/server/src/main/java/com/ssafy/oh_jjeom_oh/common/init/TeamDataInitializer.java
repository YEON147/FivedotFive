package com.ssafy.oh_jjeom_oh.common.init;

import com.ssafy.oh_jjeom_oh.domain.board.entity.WishBoard;
import com.ssafy.oh_jjeom_oh.domain.board.repository.WishBoardRepository;
import com.ssafy.oh_jjeom_oh.domain.user.entity.User;
import com.ssafy.oh_jjeom_oh.domain.user.entity.enums.Role;
import com.ssafy.oh_jjeom_oh.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * 서버 시작 시 구단 계정의 role / team_tag / boardSlug / isPublic 을 자동으로 보정합니다.
 * - Flyway V9 마이그레이션으로 최초 설정되지만, 혹시라도 값이 변경되었을 경우 복구합니다.
 * - AdminDataInitializer(Order 기본값) 이후에 실행되도록 @Order(2) 지정합니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Order(2)
public class TeamDataInitializer implements ApplicationRunner {

    // username → team_tag (stickers/baseball/{teamTag}/ 폴더명과 일치)
    private static final Map<String, String> TEAM_ACCOUNTS = Map.of(
            "lottegiants", "giants",
            "ncdinos",     "dinos",
            "samsung",     "lions",
            "eagles",      "eagles",
            "kiwoom",      "heroes",
            "twins",       "twins",
            "doosan",      "bears",
            "kia",         "tigers",
            "ssg",         "landers",
            "wiz",         "wiz"
    );

    private final UserRepository userRepository;
    private final WishBoardRepository wishBoardRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        TEAM_ACCOUNTS.forEach(this::ensureTeamAccount);
    }

    private void ensureTeamAccount(String username, String teamTag) {
        userRepository.findByUsername(username).ifPresentOrElse(
                user -> {
                    boolean changed = false;
                    if (user.getRole() != Role.TEAM || !teamTag.equals(user.getTeamTag())) {
                        log.info("[TeamInit] 구단 계정 보정: username={} role={} teamTag={}", username, user.getRole(), user.getTeamTag());
                        user.promoteToTeam(teamTag);
                        changed = true;
                    }
                    ensureBoard(user, username, changed);
                },
                () -> log.warn("[TeamInit] 구단 계정을 찾을 수 없습니다: username={}", username)
        );
    }

    private void ensureBoard(User user, String username, boolean userChanged) {
        wishBoardRepository.findByUser(user).ifPresentOrElse(
                board -> {
                    boolean needUpdate = false;
                    if (!username.equals(board.getBoardSlug())) {
                        log.info("[TeamInit] 구단 보드 슬러그 보정: {} → {}", board.getBoardSlug(), username);
                        board.updateBoardSlug(username);
                        needUpdate = true;
                    }
                    if (!Boolean.TRUE.equals(board.getIsPublic())) {
                        log.info("[TeamInit] 구단 보드 공개 보정: slug={}", username);
                        board.updateIsPublic(true);
                        needUpdate = true;
                    }
                    if (!needUpdate && !userChanged) {
                        log.debug("[TeamInit] 구단 계정 이상 없음: username={}", username);
                    }
                },
                () -> {
                    log.info("[TeamInit] 구단 보드 생성: slug={}", username);
                    wishBoardRepository.save(WishBoard.builder()
                            .user(user)
                            .boardSlug(username)
                            .isPublic(true)
                            .build());
                }
        );
    }
}
