-- role 컬럼 체크 제약에 TEAM 추가
ALTER TABLE users DROP CONSTRAINT users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role::text = ANY (ARRAY[
        'CHILD'::character varying,
        'PARENT'::character varying,
        'ADMIN'::character varying,
        'TEAM'::character varying
    ]::text[]));
