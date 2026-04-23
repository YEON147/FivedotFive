package com.ssafy.oh_jjeom_oh.domain.ranking.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.oh_jjeom_oh.domain.ranking.dto.SchoolCommentRankRow;
import com.ssafy.oh_jjeom_oh.domain.ranking.dto.SchoolUserRankRow;
import com.ssafy.oh_jjeom_oh.domain.ranking.dto.UserCommentRankRow;
import com.ssafy.oh_jjeom_oh.domain.ranking.dto.response.SchoolCommentRankingResponse;
import com.ssafy.oh_jjeom_oh.domain.ranking.dto.response.SchoolUserRankingResponse;
import com.ssafy.oh_jjeom_oh.domain.ranking.dto.response.UserCommentRankingResponse;
import com.ssafy.oh_jjeom_oh.domain.ranking.repository.RankingRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
@RequiredArgsConstructor
public class RankingService {

    private static final String CACHE_KEY_SCHOOL_USER    = "ranking:school:users";
    private static final String CACHE_KEY_SCHOOL_COMMENT = "ranking:school:comments";
    private static final String CACHE_KEY_USER_COMMENT   = "ranking:user:comments";

    private static final String LOCK_KEY_INIT      = "lock:ranking:init";
    private static final String LOCK_KEY_SCHEDULED = "lock:ranking:scheduled";
    private static final long   LOCK_TTL_SECONDS   = 55;

    private final RankingRepository rankingRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    // 앱 시작 시 초기 캐시 적재 (분산 락으로 단일 인스턴스만 실행)
    @PostConstruct
    public void initCache() {
        try {
            Boolean acquired = redisTemplate.opsForValue()
                    .setIfAbsent(LOCK_KEY_INIT, "locked", LOCK_TTL_SECONDS, TimeUnit.SECONDS);
            if (!Boolean.TRUE.equals(acquired)) {
                log.info("다른 인스턴스가 초기 랭킹 캐시 적재 중 - 건너뜀");
                return;
            }
            try {
                doRefreshAllRankings();
            } finally {
                redisTemplate.delete(LOCK_KEY_INIT);
            }
        } catch (Exception e) {
            log.warn("초기 랭킹 캐시 적재 실패 (Redis 연결 불가 등): {}", e.getMessage());
        }
    }

    // 매 1분마다 캐시 갱신 (테스트용, 운영 시 "0 0 * * * *"으로 변경) - 분산 락 적용
    @Scheduled(cron = "0 * * * * *")
    @Transactional(readOnly = true)
    public void refreshAllRankings() {
        Boolean acquired = redisTemplate.opsForValue()
                .setIfAbsent(LOCK_KEY_SCHEDULED, "locked", LOCK_TTL_SECONDS, TimeUnit.SECONDS);
        if (!Boolean.TRUE.equals(acquired)) {
            log.debug("다른 인스턴스가 랭킹 캐시 갱신 중 - 건너뜀");
            return;
        }
        try {
            doRefreshAllRankings();
        } finally {
            redisTemplate.delete(LOCK_KEY_SCHEDULED);
        }
    }

    private void doRefreshAllRankings() {
        refreshSchoolUserRanking();
        refreshSchoolCommentRanking();
        refreshUserCommentRanking();
    }

    public SchoolUserRankingResponse getSchoolUserRanking() {
        return getFromCache(CACHE_KEY_SCHOOL_USER, SchoolUserRankingResponse.class);
    }

    public SchoolCommentRankingResponse getSchoolCommentRanking() {
        return getFromCache(CACHE_KEY_SCHOOL_COMMENT, SchoolCommentRankingResponse.class);
    }

    public UserCommentRankingResponse getUserCommentRanking() {
        return getFromCache(CACHE_KEY_USER_COMMENT, UserCommentRankingResponse.class);
    }

    private void refreshSchoolUserRanking() {
        try {
            List<SchoolUserRankRow> rows = rankingRepository.findSchoolUserRanking();
            AtomicInteger rankCounter = new AtomicInteger(1);
            List<SchoolUserRankingResponse.RankItem> items = rows.stream()
                    .map(r -> new SchoolUserRankingResponse.RankItem(
                            rankCounter.getAndIncrement(), r.getSchool(), r.getUserCount()))
                    .toList();
            saveToCache(CACHE_KEY_SCHOOL_USER, SchoolUserRankingResponse.of(items));
        } catch (Exception e) {
            log.error("학교별 사용자 수 랭킹 캐시 갱신 실패", e);
        }
    }

    private void refreshSchoolCommentRanking() {
        try {
            List<SchoolCommentRankRow> rows = rankingRepository.findSchoolCommentRanking();
            AtomicInteger rankCounter = new AtomicInteger(1);
            List<SchoolCommentRankingResponse.RankItem> items = rows.stream()
                    .map(r -> new SchoolCommentRankingResponse.RankItem(
                            rankCounter.getAndIncrement(), r.getSchool(), r.getCommentCount()))
                    .toList();
            saveToCache(CACHE_KEY_SCHOOL_COMMENT, SchoolCommentRankingResponse.of(items));
        } catch (Exception e) {
            log.error("학교별 댓글 수 랭킹 캐시 갱신 실패", e);
        }
    }

    private void refreshUserCommentRanking() {
        try {
            List<UserCommentRankRow> rows = rankingRepository.findUserCommentRanking();
            AtomicInteger rankCounter = new AtomicInteger(1);
            List<UserCommentRankingResponse.RankItem> items = rows.stream()
                    .map(r -> new UserCommentRankingResponse.RankItem(
                            rankCounter.getAndIncrement(), r.getUsername(), r.getCommentCount()))
                    .toList();
            saveToCache(CACHE_KEY_USER_COMMENT, UserCommentRankingResponse.of(items));
        } catch (Exception e) {
            log.error("개인별 댓글 수 랭킹 캐시 갱신 실패", e);
        }
    }

    private <T> void saveToCache(String key, T value) throws JsonProcessingException {
        redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(value));
    }

    private <T> T getFromCache(String key, Class<T> type) {
        try {
            String json = redisTemplate.opsForValue().get(key);
            if (json == null) return null;
            return objectMapper.readValue(json, type);
        } catch (JsonProcessingException e) {
            log.error("랭킹 캐시 역직렬화 실패: {}", key, e);
            return null;
        }
    }
}
