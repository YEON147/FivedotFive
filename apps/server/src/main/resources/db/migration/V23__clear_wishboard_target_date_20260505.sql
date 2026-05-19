-- V23: 레거시 2026-05-05 targetDate 위시보드 → NULL (스케줄러 만료 삭제 방지)
--
-- V21은 TEAM role만 NULL 처리. ADMIN·일반 계정에 남은 5/5 기준일도 동일하게 제외한다.
-- target_date = NULL 이면 BoardSoftDeleteScheduler(findAllByTargetDateBefore) 대상이 아님.

UPDATE wish_boards
SET target_date = NULL
WHERE target_date = DATE '2026-05-05'
  AND is_saved_copy = FALSE;
