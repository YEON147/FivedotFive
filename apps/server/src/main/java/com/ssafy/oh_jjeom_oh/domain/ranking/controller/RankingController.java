package com.ssafy.oh_jjeom_oh.domain.ranking.controller;

import com.ssafy.oh_jjeom_oh.common.response.ApiResponse;
import com.ssafy.oh_jjeom_oh.common.response.SuccessMessage;
import com.ssafy.oh_jjeom_oh.domain.ranking.dto.response.SchoolCommentRankingResponse;
import com.ssafy.oh_jjeom_oh.domain.ranking.dto.response.SchoolUserRankingResponse;
import com.ssafy.oh_jjeom_oh.domain.ranking.dto.response.UserCommentRankingResponse;
import com.ssafy.oh_jjeom_oh.domain.ranking.service.RankingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rankings")
@RequiredArgsConstructor
public class RankingController {

    private final RankingService rankingService;

    // GET /api/rankings/schools/users - 학교별 사용자 수 랭킹 (Anyone)
    @GetMapping("/schools/users")
    public ResponseEntity<ApiResponse<SchoolUserRankingResponse>> getSchoolUserRanking() {
        SchoolUserRankingResponse data = rankingService.getSchoolUserRanking();
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.SCHOOL_USER_RANKING_FOUND, data));
    }

    // GET /api/rankings/schools/comments - 학교별 댓글 수 랭킹 (Anyone)
    @GetMapping("/schools/comments")
    public ResponseEntity<ApiResponse<SchoolCommentRankingResponse>> getSchoolCommentRanking() {
        SchoolCommentRankingResponse data = rankingService.getSchoolCommentRanking();
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.SCHOOL_COMMENT_RANKING_FOUND, data));
    }

    // GET /api/rankings/users/comments - 개인별 댓글 수 랭킹 (Anyone)
    @GetMapping("/users/comments")
    public ResponseEntity<ApiResponse<UserCommentRankingResponse>> getUserCommentRanking() {
        UserCommentRankingResponse data = rankingService.getUserCommentRanking();
        return ResponseEntity.ok(ApiResponse.success(SuccessMessage.USER_COMMENT_RANKING_FOUND, data));
    }
}
