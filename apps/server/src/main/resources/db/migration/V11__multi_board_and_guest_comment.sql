-- V11: 다중 위시보드 지원 및 비로그인 댓글 기능을 위한 스키마 변경
-- 무중단 배포 가능 (모든 변경이 nullable 컬럼 추가 또는 제약 조건 완화)

-- 1. wish_boards: title 컬럼 추가 (nullable)
ALTER TABLE wish_boards ADD COLUMN IF NOT EXISTS title VARCHAR(100);

-- 2. wish_boards: reveal_at 컬럼 추가 - 보드별 댓글 공개 시각 (nullable)
ALTER TABLE wish_boards ADD COLUMN IF NOT EXISTS reveal_at TIMESTAMP;

-- 3. wish_boards: user_id UNIQUE 제약 해제 → 사용자당 여러 위시보드 생성 허용
ALTER TABLE wish_boards DROP CONSTRAINT IF EXISTS ukcp3g7txu69h866ksqj7qcjyu4;

-- 4. wish_comments: guest_password 컬럼 추가 - 비로그인 댓글 수정/삭제용 (nullable)
ALTER TABLE wish_comments ADD COLUMN IF NOT EXISTS guest_password VARCHAR(255);

-- 5. users: nickname NOT NULL 제약 해제 → 닉네임 선택 입력 허용
ALTER TABLE users ALTER COLUMN nickname DROP NOT NULL;
