-- V22: 레거시 허수민 계정명 hesumin → heosumin (SsafyDataInitializer 와 동일)
-- 전희연(jeonhiyeon) 등 다른 계정은 변경하지 않음.
-- 이미 heosumin 이 있으면 스킵(유니크 충돌 방지). 멱등.
UPDATE users u
SET username = 'heosumin',
    team_tag = 'heosumin',
    nickname = '허수민프로',
    updated_at = now()
WHERE u.username = 'hesumin'
  AND NOT EXISTS (SELECT 1 FROM users u2 WHERE u2.username = 'heosumin');
