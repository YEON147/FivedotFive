package com.ssafy.oh_jjeom_oh.domain.ranking.dto.response;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
public class SchoolUserRankingResponse {

    private final List<RankItem> rankings;
    private final LocalDateTime updatedAt;

    @JsonCreator
    public SchoolUserRankingResponse(
            @JsonProperty("rankings") List<RankItem> rankings,
            @JsonProperty("updatedAt") LocalDateTime updatedAt) {
        this.rankings = rankings;
        this.updatedAt = updatedAt;
    }

    public static SchoolUserRankingResponse of(List<RankItem> rankings) {
        return new SchoolUserRankingResponse(rankings, LocalDateTime.now());
    }

    @Getter
    public static class RankItem {
        private final int rank;
        private final String school;
        private final long userCount;

        @JsonCreator
        public RankItem(
                @JsonProperty("rank") int rank,
                @JsonProperty("school") String school,
                @JsonProperty("userCount") long userCount) {
            this.rank = rank;
            this.school = school;
            this.userCount = userCount;
        }
    }
}
