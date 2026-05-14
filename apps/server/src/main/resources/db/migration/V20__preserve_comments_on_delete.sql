-- V20: 댓글 누적 집계 보존을 위한 FK ON DELETE 정책 변경
--
-- 변경 전: CASCADE / RESTRICT  →  변경 후: SET NULL
-- 보드·롤링페이퍼가 삭제되어도 댓글 레코드가 남아 랭킹 집계에 반영됨
-- 회원 탈퇴 시 rolling_papers.user_id 도 SET NULL 으로 변경하여 원본 롤링페이퍼를 보존

-- 1. wish_comments.wish_list_id: NOT NULL 제거 + FK RESTRICT → SET NULL
ALTER TABLE wish_comments ALTER COLUMN wish_list_id DROP NOT NULL;

ALTER TABLE wish_comments DROP CONSTRAINT fkfv2x787r3u0j1goigtbhqdl2w;
ALTER TABLE wish_comments
    ADD CONSTRAINT fk_wish_comments_wish_board
        FOREIGN KEY (wish_list_id) REFERENCES wish_boards (id)
            ON DELETE SET NULL;

-- 2. rolling_paper_comments.rolling_paper_id: NOT NULL 제거 + FK CASCADE → SET NULL
ALTER TABLE rolling_paper_comments ALTER COLUMN rolling_paper_id DROP NOT NULL;

ALTER TABLE rolling_paper_comments DROP CONSTRAINT fk_rp_comments_rolling_paper;
ALTER TABLE rolling_paper_comments
    ADD CONSTRAINT fk_rp_comments_rolling_paper
        FOREIGN KEY (rolling_paper_id) REFERENCES rolling_papers (id)
            ON DELETE SET NULL;

-- 3. rolling_papers.user_id: NOT NULL 제거 + FK CASCADE → SET NULL
--    회원 탈퇴 시 원본 롤링페이퍼 삭제 대신 user_id = NULL 처리
ALTER TABLE rolling_papers ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE rolling_papers DROP CONSTRAINT fk_rolling_papers_user;
ALTER TABLE rolling_papers
    ADD CONSTRAINT fk_rolling_papers_user
        FOREIGN KEY (user_id) REFERENCES users (id)
            ON DELETE SET NULL;
