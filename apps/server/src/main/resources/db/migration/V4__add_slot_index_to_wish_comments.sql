-- V4: wish_comments 테이블에 slot_index 컬럼 및 유니크 제약조건 추가
-- WishComment 엔티티에 slot_index 필드가 추가되어 스키마 동기화가 필요합니다.

-- 1. slot_index 컬럼 추가 (null 허용 - 기존 데이터 호환)
ALTER TABLE wish_comments ADD COLUMN IF NOT EXISTS slot_index INTEGER;

-- 2. (wish_list_id, slot_index) 유니크 제약조건 추가
ALTER TABLE wish_comments DROP CONSTRAINT IF EXISTS uk_wish_comments_board_slot;
ALTER TABLE wish_comments
    ADD CONSTRAINT uk_wish_comments_board_slot UNIQUE (wish_list_id, slot_index);
