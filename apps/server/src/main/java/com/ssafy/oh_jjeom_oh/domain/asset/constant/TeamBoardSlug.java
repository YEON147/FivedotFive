package com.ssafy.oh_jjeom_oh.domain.asset.constant;

import java.util.Set;

/** {@link com.ssafy.oh_jjeom_oh.common.init.TeamDataInitializer} 구단 계정 username·boardSlug 와 동일 */
public final class TeamBoardSlug {

    private static final Set<String> TEAM_SLUGS = Set.of(
            "lottegiants",
            "ncdinos",
            "samsung",
            "eagles",
            "kiwoom",
            "twins",
            "doosan",
            "kia",
            "ssg",
            "wiz");

    private TeamBoardSlug() {}

    public static boolean isTeamBoard(String slug) {
        return slug != null && TEAM_SLUGS.contains(slug.trim());
    }
}
