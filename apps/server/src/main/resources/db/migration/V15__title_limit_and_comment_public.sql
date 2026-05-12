-- 기존 데이터 중 8자 초과 title을 기본값으로 교체
UPDATE wish_boards SET title = '내 위시리스트' WHERE LENGTH(title) > 8;
UPDATE rolling_papers SET title = '롤링페이퍼' WHERE LENGTH(title) > 8;

-- wish_boards.title 최대 길이 8자로 변경
ALTER TABLE wish_boards ALTER COLUMN title TYPE VARCHAR(8);

-- rolling_papers.title 최대 길이 8자로 변경
ALTER TABLE rolling_papers ALTER COLUMN title TYPE VARCHAR(8);

-- rolling_papers에 댓글 즉시 공개 여부 컬럼 추가 (기본값 false = targetDate 기준 공개)
ALTER TABLE rolling_papers ADD COLUMN is_comment_public BOOLEAN NOT NULL DEFAULT FALSE;
