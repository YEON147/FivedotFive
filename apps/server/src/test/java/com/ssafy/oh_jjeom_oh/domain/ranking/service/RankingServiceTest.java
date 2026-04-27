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
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
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
                new UserCommentRankingResponse.RankItem(1, "yeonjae123", "연재", 56),
                new UserCommentRankingResponse.RankItem(2, "minjae456", "민재", 43)
        ));
        String json = objectMapper.writeValueAsString(cached);
        given(valueOperations.get("ranking:user:comments")).willReturn(json);

        UserCommentRankingResponse result = rankingService.getUserCommentRanking();

        assertThat(result).isNotNull();
        assertThat(result.getRankings()).hasSize(2);
        assertThat(result.getRankings().get(0).getUsername()).isEqualTo("yeonjae123");
        assertThat(result.getRankings().get(0).getNickname()).isEqualTo("연재");
        assertThat(result.getRankings().get(0).getCommentCount()).isEqualTo(56);
    }

    // ===================== refreshAllRankings =====================

    @Test
    @DisplayName("캐시 갱신 - 분산 락 획득 성공 시 DB 쿼리 후 Redis에 저장")
    void refreshAllRankings_lockAcquired_savesToRedis() {
        given(valueOperations.setIfAbsent(eq("lock:ranking:scheduled"), anyString(), anyLong(), any(TimeUnit.class)))
                .willReturn(true);
        given(rankingRepository.findSchoolUserRanking(any(Pageable.class))).willReturn(List.of(
                mockSchoolUserRow("소강초등학교", 42L)
        ));
        given(rankingRepository.findSchoolCommentRanking(any(Pageable.class))).willReturn(List.of(
                mockSchoolCommentRow("소강초등학교", 128L)
        ));
        given(rankingRepository.findUserCommentRanking(any(Pageable.class))).willReturn(List.of(
                mockUserCommentRow("yeonjae123", 56L)
        ));

        rankingService.refreshAllRankings();

        verify(valueOperations, times(3)).set(anyString(), anyString());
        verify(redisTemplate).delete("lock:ranking:scheduled");
    }

    @Test
    @DisplayName("캐시 갱신 - 분산 락 획득 실패 시 DB 쿼리 건너뜀")
    void refreshAllRankings_lockNotAcquired_skipsDbQuery() {
        given(valueOperations.setIfAbsent(eq("lock:ranking:scheduled"), anyString(), anyLong(), any(TimeUnit.class)))
                .willReturn(false);

        rankingService.refreshAllRankings();

        verify(rankingRepository, never()).findSchoolUserRanking(any(Pageable.class));
        verify(rankingRepository, never()).findSchoolCommentRanking(any(Pageable.class));
        verify(rankingRepository, never()).findUserCommentRanking(any(Pageable.class));
        verify(valueOperations, never()).set(anyString(), anyString());
    }

    @Test
    @DisplayName("캐시 갱신 - rank 번호가 1부터 순서대로 부여됨")
    void refreshAllRankings_rankNumberAssignedCorrectly() throws Exception {
        given(valueOperations.setIfAbsent(eq("lock:ranking:scheduled"), anyString(), anyLong(), any(TimeUnit.class)))
                .willReturn(true);
        given(rankingRepository.findSchoolUserRanking(any(Pageable.class))).willReturn(List.of(
                mockSchoolUserRow("소강초등학교", 42L),
                mockSchoolUserRow("한강초등학교", 38L),
                mockSchoolUserRow("마포초등학교", 20L)
        ));
        given(rankingRepository.findSchoolCommentRanking(any(Pageable.class))).willReturn(List.of());
        given(rankingRepository.findUserCommentRanking(any(Pageable.class))).willReturn(List.of());

        rankingService.refreshAllRankings();

        var captor = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(valueOperations).set(eq("ranking:school:users"), captor.capture());

        SchoolUserRankingResponse saved = objectMapper.readValue(captor.getValue(), SchoolUserRankingResponse.class);
        assertThat(saved.getRankings().get(0).getRank()).isEqualTo(1);
        assertThat(saved.getRankings().get(1).getRank()).isEqualTo(2);
        assertThat(saved.getRankings().get(2).getRank()).isEqualTo(3);
    }

    // ===================== limit 100 & 0건 포함 =====================

    @Test
    @DisplayName("캐시 갱신 - DB 레벨에서 100개 제한 (PageRequest size=100 전달 검증)")
    void refreshAllRankings_passesPageableWithSize100() {
        given(valueOperations.setIfAbsent(eq("lock:ranking:scheduled"), anyString(), anyLong(), any(TimeUnit.class)))
                .willReturn(true);

        List<SchoolUserRankRow> exactly100 = new java.util.ArrayList<>();
        for (int i = 1; i <= 100; i++) {
            exactly100.add(mockSchoolUserRow("학교" + i, (long)(100 - i)));
        }
        given(rankingRepository.findSchoolUserRanking(any(Pageable.class))).willReturn(exactly100);
        given(rankingRepository.findSchoolCommentRanking(any(Pageable.class))).willReturn(List.of());
        given(rankingRepository.findUserCommentRanking(any(Pageable.class))).willReturn(List.of());

        rankingService.refreshAllRankings();

        // DB에 Pageable(size=100)을 전달했는지 검증
        var pageableCaptor = org.mockito.ArgumentCaptor.forClass(Pageable.class);
        verify(rankingRepository).findSchoolUserRanking(pageableCaptor.capture());
        assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(100);
    }

    @Test
    @DisplayName("캐시 갱신 - commentCount=0인 항목도 랭킹에 포함됨")
    void refreshAllRankings_zeroCommentCountIncluded() throws Exception {
        given(valueOperations.setIfAbsent(eq("lock:ranking:scheduled"), anyString(), anyLong(), any(TimeUnit.class)))
                .willReturn(true);
        given(rankingRepository.findSchoolUserRanking(any(Pageable.class))).willReturn(List.of());
        given(rankingRepository.findSchoolCommentRanking(any(Pageable.class))).willReturn(List.of(
                mockSchoolCommentRow("소강초등학교", 128L),
                mockSchoolCommentRow("댓글없는학교", 0L)
        ));
        given(rankingRepository.findUserCommentRanking(any(Pageable.class))).willReturn(List.of(
                mockUserCommentRow("yeonjae123", 56L),
                mockUserCommentRow("silent_user", 0L)
        ));

        rankingService.refreshAllRankings();

        var schoolCaptor = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(valueOperations).set(eq("ranking:school:comments"), schoolCaptor.capture());
        SchoolCommentRankingResponse schoolSaved = objectMapper.readValue(schoolCaptor.getValue(), SchoolCommentRankingResponse.class);
        assertThat(schoolSaved.getRankings()).hasSize(2);
        assertThat(schoolSaved.getRankings().get(1).getCommentCount()).isEqualTo(0);

        var userCaptor = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(valueOperations).set(eq("ranking:user:comments"), userCaptor.capture());
        UserCommentRankingResponse userSaved = objectMapper.readValue(userCaptor.getValue(), UserCommentRankingResponse.class);
        assertThat(userSaved.getRankings()).hasSize(2);
        assertThat(userSaved.getRankings().get(1).getCommentCount()).isEqualTo(0);
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
        return mockUserCommentRow(username, username + "_nick", commentCount);
    }

    private UserCommentRankRow mockUserCommentRow(String username, String nickname, Long commentCount) {
        return new UserCommentRankRow() {
            public String getUsername() { return username; }
            public String getNickname() { return nickname; }
            public Long getCommentCount() { return commentCount; }
        };
    }
}
