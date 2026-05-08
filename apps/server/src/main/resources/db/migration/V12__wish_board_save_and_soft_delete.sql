-- V12: 위시보드 저장(독립 복사본) 및 소프트 딜리트 지원을 위한 스키마 변경
-- 무중단 배포 가능 (nullable 컬럼 추가 / NOT NULL DEFAULT FALSE 컬럼은 기존 행에 기본값 자동 적용)

-- 1. wish_boards: reveal_at 컬럼 제거 (targetDate로 역할 통합, V11에서 추가됐으나 미사용)
ALTER TABLE wish_boards DROP COLUMN IF EXISTS reveal_at;

-- 2. wish_boards: is_saved_copy 컬럼 추가 (true = 저장된 독립 복사본, false = 원본)
ALTER TABLE wish_boards ADD COLUMN IF NOT EXISTS is_saved_copy BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. wish_boards: saved_by_user_id 컬럼 추가 (복사본을 저장한 사용자, 원본이면 NULL)
ALTER TABLE wish_boards ADD COLUMN IF NOT EXISTS saved_by_user_id BIGINT;

-- 4. wish_boards: deleted_at 컬럼 추가 (스케줄러에 의한 soft delete 일시, NULL = 유효한 원본)
ALTER TABLE wish_boards ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- 5. wish_boards: saved_by_user_id FK 추가 (저장한 사용자 탈퇴 시 NULL 처리)
ALTER TABLE wish_boards
    ADD CONSTRAINT fk_wish_boards_saved_by
    FOREIGN KEY (saved_by_user_id) REFERENCES users (id)
    ON DELETE SET NULL;

-- 6. wish_boards: saved_by_user_id 인덱스 추가 (내가 저장한 위시보드 목록 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_wish_boards_saved_by ON wish_boards (saved_by_user_id);
