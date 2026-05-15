-- V21: 공유 링크 만료 정책 제거 + 팀 보드 targetDate 초기화
--
-- 1. share_links.expires_at 컬럼 제거 (링크 영구 유효)
ALTER TABLE share_links DROP COLUMN expires_at;

-- 2. TEAM role 계정(구단 보드)의 위시보드 targetDate를 NULL로 초기화
--    (기존 5/5 기본값으로 인해 스케줄러에 의해 삭제되는 문제 방지)
UPDATE wish_boards
SET target_date = NULL
WHERE user_id IN (
    SELECT id FROM users WHERE role = 'TEAM'
);
