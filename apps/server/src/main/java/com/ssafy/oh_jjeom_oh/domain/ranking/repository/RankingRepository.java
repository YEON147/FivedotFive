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

    @Query("""
            SELECT u.school AS school, COUNT(wc.id) AS commentCount
            FROM User u
            LEFT JOIN WishComment wc ON wc.user = u AND wc.isUser = true
            WHERE u.school IS NOT NULL AND u.status = 'ACTIVE'
            GROUP BY u.school
            ORDER BY COUNT(wc.id) DESC, u.school ASC
            """)
    List<SchoolCommentRankRow> findSchoolCommentRanking(Pageable pageable);

    @Query("""
            SELECT u.username AS username, COUNT(wc.id) AS commentCount
            FROM User u
            LEFT JOIN WishComment wc ON wc.user = u AND wc.isUser = true
            WHERE u.status = 'ACTIVE'
            GROUP BY u.id, u.username
            ORDER BY COUNT(wc.id) DESC, u.username ASC
            """)
    List<UserCommentRankRow> findUserCommentRanking(Pageable pageable);
}
