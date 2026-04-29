-- V6: 관리자 계정(ohjeomoh)의 role을 ADMIN으로 보정
-- AdminDataInitializer는 계정이 없을 때만 ADMIN으로 생성하므로,
-- 배포 이전에 수동으로 생성된 계정은 CHILD role을 가질 수 있습니다.
-- 이 마이그레이션이 실행되는 시점에 ohjeomoh 계정이 아직 없어도 안전합니다.

UPDATE users
SET role = 'ADMIN'
WHERE username = 'ohjeomoh'
  AND role != 'ADMIN';
