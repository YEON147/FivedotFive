package com.ssafy.oh_jjeom_oh.domain.ranking.repository;

import com.ssafy.oh_jjeom_oh.domain.ranking.dto.SchoolCommentRankRow;
import com.ssafy.oh_jjeom_oh.domain.ranking.dto.SchoolUserRankRow;
import com.ssafy.oh_jjeom_oh.domain.ranking.dto.UserCommentRankRow;
import com.ssafy.oh_jjeom_oh.domain.comment.entity.WishComment;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface RankingRepository extends JpaRepository<WishComment, Long> {

    @Query("""
            SELECT u.school AS school, COUNT(u.id) AS userCount
            FROM User u
            WHERE u.school IS NOT NULL AND u.status = 'ACTIVE'
            GROUP BY u.school
            ORDER BY COUNT(u.id) DESC
            """)
    List<SchoolUserRankRow> findSchoolUserRanking(Pageable pageable);

    /**
     * 학교별 댓글 수 랭킹:
     *  - WishComment + RollingPaperComment 합산
     *  - rolling_paper_id가 NULL인 댓글(원본 삭제 후 보존)도 집계에 포함
     *  - 저장된 복사본(is_saved_copy=true)의 댓글은 이중집계 방지를 위해 제외
     *  - 탈퇴 사용자(status != 'ACTIVE') 제외
     */
    @Query(value = """
            SELECT u.school                                                                   AS school,
                   SUM(COALESCE(wc_cnt.cnt, 0) + COALESCE(rpc_cnt.cnt, 0))                  AS "commentCount"
            FROM users u
            LEFT JOIN (
                SELECT user_id, COUNT(*) AS cnt
                FROM wish_comments WHERE is_user = true GROUP BY user_id
            ) wc_cnt ON wc_cnt.user_id = u.id
            LEFT JOIN (
                SELECT rpc.user_id, COUNT(*) AS cnt
                FROM rolling_paper_comments rpc
                LEFT JOIN rolling_papers rp ON rpc.rolling_paper_id = rp.id
                WHERE rpc.is_user = true
                  AND (rpc.rolling_paper_id IS NULL OR rp.is_saved_copy = false)
                GROUP BY rpc.user_id
            ) rpc_cnt ON rpc_cnt.user_id = u.id
            WHERE u.school IS NOT NULL AND u.status = 'ACTIVE'
            GROUP BY u.school
            ORDER BY "commentCount" DESC, u.school ASC
            """, nativeQuery = true)
    List<SchoolCommentRankRow> findSchoolCommentRanking(Pageable pageable);

    /**
     * 사용자별 댓글 수 랭킹:
     *  - WishComment + RollingPaperComment 합산
     *  - 탈퇴 사용자(status != 'ACTIVE') 제외
     */
    @Query(value = """
            SELECT u.username                                                                  AS username,
                   u.nickname                                                                  AS nickname,
                   COALESCE(wc_cnt.cnt, 0) + COALESCE(rpc_cnt.cnt, 0)                        AS "commentCount"
            FROM users u
            LEFT JOIN (
                SELECT user_id, COUNT(*) AS cnt
                FROM wish_comments WHERE is_user = true GROUP BY user_id
            ) wc_cnt ON wc_cnt.user_id = u.id
            LEFT JOIN (
                SELECT rpc.user_id, COUNT(*) AS cnt
                FROM rolling_paper_comments rpc
                LEFT JOIN rolling_papers rp ON rpc.rolling_paper_id = rp.id
                WHERE rpc.is_user = true
                  AND (rpc.rolling_paper_id IS NULL OR rp.is_saved_copy = false)
                GROUP BY rpc.user_id
            ) rpc_cnt ON rpc_cnt.user_id = u.id
            WHERE u.status = 'ACTIVE'
            ORDER BY "commentCount" DESC, u.username ASC
            """, nativeQuery = true)
    List<UserCommentRankRow> findUserCommentRanking(Pageable pageable);
}
