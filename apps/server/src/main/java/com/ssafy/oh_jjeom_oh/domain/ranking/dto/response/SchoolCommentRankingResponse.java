package com.ssafy.oh_jjeom_oh.domain.ranking.dto.response;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
public class SchoolCommentRankingResponse {

    private final List<RankItem> rankings;
    private final LocalDateTime updatedAt;

    @JsonCreator
    public SchoolCommentRankingResponse(
            @JsonProperty("rankings") List<RankItem> rankings,
            @JsonProperty("updatedAt") LocalDateTime updatedAt) {
        this.rankings = rankings;
        this.updatedAt = updatedAt;
    }

    public static SchoolCommentRankingResponse of(List<RankItem> rankings) {
        return new SchoolCommentRankingResponse(rankings, LocalDateTime.now());
    }

    @Getter
    public static class RankItem {
        private final int rank;
        private final String school;
        private final long commentCount;

        @JsonCreator
        public RankItem(
                @JsonProperty("rank") int rank,
                @JsonProperty("school") String school,
                @JsonProperty("commentCount") long commentCount) {
            this.rank = rank;
            this.school = school;
            this.commentCount = commentCount;
        }
    }
}
