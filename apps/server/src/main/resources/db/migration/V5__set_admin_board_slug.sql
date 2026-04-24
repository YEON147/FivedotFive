-- V5: 관리자 계정(ohjeomoh)의 위시보드 slug를 'ohjeomoh'로 고정
-- 메인 페이지에서 관리자 위시보드로 고정 URL 연결을 위해 slug를 예측 가능한 값으로 설정합니다.

UPDATE wish_boards
SET board_slug = 'ohjeomoh'
WHERE user_id = (SELECT id FROM users WHERE username = 'ohjeomoh');
