package com.ssafy.oh_jjeom_oh.domain.ranking.dto.response;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
public class UserCommentRankingResponse {

    private final List<RankItem> rankings;
    private final LocalDateTime updatedAt;

    @JsonCreator
    public UserCommentRankingResponse(
            @JsonProperty("rankings") List<RankItem> rankings,
            @JsonProperty("updatedAt") LocalDateTime updatedAt) {
        this.rankings = rankings;
        this.updatedAt = updatedAt;
    }

    public static UserCommentRankingResponse of(List<RankItem> rankings) {
        return new UserCommentRankingResponse(rankings, LocalDateTime.now());
    }

    @Getter
    public static class RankItem {
        private final int rank;
        private final String username;
        private final String nickname;
        private final long commentCount;

        @JsonCreator
        public RankItem(
                @JsonProperty("rank") int rank,
                @JsonProperty("username") String username,
                @JsonProperty("nickname") String nickname,
                @JsonProperty("commentCount") long commentCount) {
            this.rank = rank;
            this.username = username;
            this.nickname = nickname;
            this.commentCount = commentCount;
        }
    }
}
