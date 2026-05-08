-- wish_boards에 댓글 즉시 공개 여부 컬럼 추가 (기본값 false = targetDate 기준 공개)
ALTER TABLE wish_boards ADD COLUMN is_comment_public BOOLEAN NOT NULL DEFAULT FALSE;

-- rolling_papers.recipient_name NOT NULL 제약 제거 (받는 사람 선택 입력)
ALTER TABLE rolling_papers ALTER COLUMN recipient_name DROP NOT NULL;
