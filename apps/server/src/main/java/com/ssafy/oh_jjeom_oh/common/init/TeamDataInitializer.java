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

import java.util.List;

/**
 * 서버 시작 시 구단 계정의 role / teamTag / nickname / boardSlug / isPublic 을 보정합니다.
 * 계정이 DB에 없으면 경고 로그만 남기고 skip 합니다.
 * AdminDataInitializer(Order 기본값) 이후에 실행되도록 @Order(2) 지정합니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Order(2)
public class TeamDataInitializer implements ApplicationRunner {

    private record TeamInfo(String username, String nickname, String teamTag) {}

    private static final List<TeamInfo> TEAM_ACCOUNTS = List.of(
            new TeamInfo("lottegiants", "부산갈매기", "giants"),
            new TeamInfo("ncdinos",     "창원공룡",   "dinos"),
            new TeamInfo("samsung",     "대구사자",   "lions"),
            new TeamInfo("eagles",      "대전독수리", "eagles"),
            new TeamInfo("kiwoom",      "고척영웅",   "heroes"),
            new TeamInfo("twins",       "서울쌍둥이", "twins"),
            new TeamInfo("doosan",      "서울곰",     "bears"),
            new TeamInfo("kia",         "광주호랑이", "tigers"),
            new TeamInfo("ssg",         "인천코르소", "landers"),
            new TeamInfo("wiz",         "수원마법사", "wiz")
    );

    private final UserRepository userRepository;
    private final WishBoardRepository wishBoardRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        TEAM_ACCOUNTS.forEach(this::ensureTeamAccount);
    }

    private void ensureTeamAccount(TeamInfo info) {
        userRepository.findByUsername(info.username())
                .ifPresentOrElse(
                        user -> {
                            boolean changed = false;
                            if (user.getRole() != Role.TEAM || !info.teamTag().equals(user.getTeamTag())) {
                                log.info("[TeamInit] 구단 계정 role/teamTag 보정: username={}", info.username());
                                user.promoteToTeam(info.teamTag());
                                changed = true;
                            }
                            if (!info.nickname().equals(user.getNickname())) {
                                log.info("[TeamInit] 구단 계정 nickname 보정: username={} [{}] → [{}]",
                                        info.username(), user.getNickname(), info.nickname());
                                user.updateNickname(info.nickname());
                                changed = true;
                            }
                            if (!changed) {
                                log.debug("[TeamInit] 구단 계정 이상 없음: username={}", info.username());
                            }
                            ensureBoard(user, info.username());
                        },
                        () -> log.warn("[TeamInit] 구단 계정 없음 (skip): username={}", info.username())
                );
    }

    /**
     * 유저 기준으로 보드를 조회하여 slug / isPublic 을 보정합니다.
     * 기존 방식(boardSlug=username 으로 조회)과 달리, 보드 slug 가 바뀐 경우에도 올바르게 교정합니다.
     */
    private void ensureBoard(User user, String username) {
        wishBoardRepository.findFirstByUser(user).ifPresentOrElse(
                board -> {
                    boolean changed = false;
                    if (!username.equals(board.getBoardSlug())) {
                        log.info("[TeamInit] 구단 보드 slug 보정: [{}] → [{}]", board.getBoardSlug(), username);
                        board.updateBoardSlug(username);
                        changed = true;
                    }
                    if (!Boolean.TRUE.equals(board.getIsPublic())) {
                        log.info("[TeamInit] 구단 보드 공개 보정: slug={}", username);
                        board.updateIsPublic(true);
                        changed = true;
                    }
                    if (!changed) {
                        log.debug("[TeamInit] 구단 보드 이상 없음: slug={}", username);
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
