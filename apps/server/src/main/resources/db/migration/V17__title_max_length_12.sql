-- wish_boards.title 최대 길이 8자 → 12자로 변경
ALTER TABLE wish_boards ALTER COLUMN title TYPE VARCHAR(12);

-- rolling_papers.title 최대 길이 8자 → 12자로 변경
ALTER TABLE rolling_papers ALTER COLUMN title TYPE VARCHAR(12);
