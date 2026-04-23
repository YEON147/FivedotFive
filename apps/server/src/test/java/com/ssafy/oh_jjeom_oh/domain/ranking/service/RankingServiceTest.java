package com.ssafy.oh_jjeom_oh.domain.ranking.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.ssafy.oh_jjeom_oh.domain.ranking.dto.SchoolCommentRankRow;
import com.ssafy.oh_jjeom_oh.domain.ranking.dto.SchoolUserRankRow;
import com.ssafy.oh_jjeom_oh.domain.ranking.dto.UserCommentRankRow;
import com.ssafy.oh_jjeom_oh.domain.ranking.dto.response.SchoolCommentRankingResponse;
import com.ssafy.oh_jjeom_oh.domain.ranking.dto.response.SchoolUserRankingResponse;
import com.ssafy.oh_jjeom_oh.domain.ranking.dto.response.UserCommentRankingResponse;
import com.ssafy.oh_jjeom_oh.domain.ranking.repository.RankingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RankingServiceTest {

    @InjectMocks
    private RankingService rankingService;

    @Mock private RankingRepository rankingRepository;
    @Mock private RedisTemplate<String, String> redisTemplate;
    @Mock private ValueOperations<String, String> valueOperations;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(rankingService, "objectMapper", objectMapper);
        given(redisTemplate.opsForValue()).willReturn(valueOperations);
    }

    // ===================== getSchoolUserRanking =====================

    @Test
    @DisplayName("학교별 사용자 수 랭킹 - Redis 캐시 반환 성공")
    void getSchoolUserRanking_fromCache() throws Exception {
        SchoolUserRankingResponse cached = SchoolUserRankingResponse.of(List.of(
                new SchoolUserRankingResponse.RankItem(1, "소강초등학교", 42),
                new SchoolUserRankingResponse.RankItem(2, "한강초등학교", 38)
        ));
        String json = objectMapper.writeValueAsString(cached);
        given(valueOperations.get("ranking:school:users")).willReturn(json);

        SchoolUserRankingResponse result = rankingService.getSchoolUserRanking();

        assertThat(result).isNotNull();
        assertThat(result.getRankings()).hasSize(2);
        assertThat(result.getRankings().get(0).getSchool()).isEqualTo("소강초등학교");
        assertThat(result.getRankings().get(0).getUserCount()).isEqualTo(42);
    }

    @Test
    @DisplayName("학교별 사용자 수 랭킹 - Redis 캐시 없으면 null 반환")
    void getSchoolUserRanking_cacheMiss_returnsNull() {
        given(valueOperations.get("ranking:school:users")).willReturn(null);

        SchoolUserRankingResponse result = rankingService.getSchoolUserRanking();

        assertThat(result).isNull();
    }

    // ===================== getSchoolCommentRanking =====================

    @Test
    @DisplayName("학교별 댓글 수 랭킹 - Redis 캐시 반환 성공")
    void getSchoolCommentRanking_fromCache() throws Exception {
        SchoolCommentRankingResponse cached = SchoolCommentRankingResponse.of(List.of(
                new SchoolCommentRankingResponse.RankItem(1, "소강초등학교", 128),
                new SchoolCommentRankingResponse.RankItem(2, "한강초등학교", 97)
        ));
        String json = objectMapper.writeValueAsString(cached);
        given(valueOperations.get("ranking:school:comments")).willReturn(json);

        SchoolCommentRankingResponse result = rankingService.getSchoolCommentRanking();

        assertThat(result).isNotNull();
        assertThat(result.getRankings()).hasSize(2);
        assertThat(result.getRankings().get(0).getCommentCount()).isEqualTo(128);
    }

    // ===================== getUserCommentRanking =====================

    @Test
    @DisplayName("개인별 댓글 수 랭킹 - Redis 캐시 반환 성공")
    void getUserCommentRanking_fromCache() throws Exception {
        UserCommentRankingResponse cached = UserCommentRankingResponse.of(List.of(
                new UserCommentRankingResponse.RankItem(1, "yeonjae123", 56),
                new UserCommentRankingResponse.RankItem(2, "minjae456", 43)
        ));
        String json = objectMapper.writeValueAsString(cached);
        given(valueOperations.get("ranking:user:comments")).willReturn(json);

        UserCommentRankingResponse result = rankingService.getUserCommentRanking();

        assertThat(result).isNotNull();
        assertThat(result.getRankings()).hasSize(2);
        assertThat(result.getRankings().get(0).getUsername()).isEqualTo("yeonjae123");
        assertThat(result.getRankings().get(0).getCommentCount()).isEqualTo(56);
    }

    // ===================== refreshAllRankings =====================

    @Test
    @DisplayName("캐시 갱신 - DB 쿼리 후 Redis에 저장")
    void refreshAllRankings_savesToRedis() {
        given(rankingRepository.findSchoolUserRanking()).willReturn(List.of(
                mockSchoolUserRow("소강초등학교", 42L)
        ));
        given(rankingRepository.findSchoolCommentRanking()).willReturn(List.of(
                mockSchoolCommentRow("소강초등학교", 128L)
        ));
        given(rankingRepository.findUserCommentRanking()).willReturn(List.of(
                mockUserCommentRow("yeonjae123", 56L)
        ));

        rankingService.refreshAllRankings();

        verify(valueOperations, times(3)).set(anyString(), anyString());
    }

    @Test
    @DisplayName("캐시 갱신 - rank 번호가 1부터 순서대로 부여됨")
    void refreshAllRankings_rankNumberAssignedCorrectly() throws Exception {
        given(rankingRepository.findSchoolUserRanking()).willReturn(List.of(
                mockSchoolUserRow("소강초등학교", 42L),
                mockSchoolUserRow("한강초등학교", 38L),
                mockSchoolUserRow("마포초등학교", 20L)
        ));
        given(rankingRepository.findSchoolCommentRanking()).willReturn(List.of());
        given(rankingRepository.findUserCommentRanking()).willReturn(List.of());

        rankingService.refreshAllRankings();

        // Redis에 저장된 값 캡처
        var captor = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(valueOperations).set(eq("ranking:school:users"), captor.capture());

        SchoolUserRankingResponse saved = objectMapper.readValue(captor.getValue(), SchoolUserRankingResponse.class);
        assertThat(saved.getRankings().get(0).getRank()).isEqualTo(1);
        assertThat(saved.getRankings().get(1).getRank()).isEqualTo(2);
        assertThat(saved.getRankings().get(2).getRank()).isEqualTo(3);
    }

    // ===== helpers =====

    private SchoolUserRankRow mockSchoolUserRow(String school, Long userCount) {
        return new SchoolUserRankRow() {
            public String getSchool() { return school; }
            public Long getUserCount() { return userCount; }
        };
    }

    private SchoolCommentRankRow mockSchoolCommentRow(String school, Long commentCount) {
        return new SchoolCommentRankRow() {
            public String getSchool() { return school; }
            public Long getCommentCount() { return commentCount; }
        };
    }

    private UserCommentRankRow mockUserCommentRow(String username, Long commentCount) {
        return new UserCommentRankRow() {
            public String getUsername() { return username; }
            public Long getCommentCount() { return commentCount; }
        };
    }
}
