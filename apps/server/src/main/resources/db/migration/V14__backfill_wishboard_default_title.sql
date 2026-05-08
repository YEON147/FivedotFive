-- 고도화 이전에 생성된 위시보드 중 title이 NULL인 항목을 '내 위시리스트'로 일괄 업데이트
UPDATE wish_boards
SET title = '내 위시리스트'
WHERE title IS NULL;
