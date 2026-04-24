-- V2: GIFT_ICON → GIFT_STICKER 데이터 및 제약조건 정정
-- 기존 DB에서 assets 테이블의 CHECK 제약조건이 GIFT_ICON을 허용하고
-- GIFT_STICKER를 허용하지 않는 경우를 교정합니다.

-- 1. 기존 CHECK 제약조건 제거 (이름과 무관하게 안전하게 처리)
ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_asset_type_check;

-- 2. GIFT_ICON 데이터를 GIFT_STICKER로 변환
UPDATE assets
SET asset_type = 'GIFT_STICKER'
WHERE asset_type = 'GIFT_ICON';

-- 3. 올바른 CHECK 제약조건 재추가
ALTER TABLE assets
    ADD CONSTRAINT assets_asset_type_check
        CHECK (asset_type IN ('BACKGROUND', 'STICKER', 'GIFT_STICKER'));

-- 4. board_assets 의 CHECK 제약조건도 GIFT_STICKER 기준으로 정규화
ALTER TABLE board_assets DROP CONSTRAINT IF EXISTS board_assets_asset_type_check;

UPDATE board_assets
SET asset_type = 'GIFT_STICKER'
WHERE asset_type = 'GIFT_ICON';

ALTER TABLE board_assets
    ADD CONSTRAINT board_assets_asset_type_check
        CHECK (asset_type IN ('BACKGROUND', 'STICKER', 'GIFT_STICKER'));
