CREATE TABLE notices (
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    banner_text VARCHAR(255),
    is_pinned   BOOLEAN      NOT NULL DEFAULT FALSE,
    start_at    TIMESTAMP    NOT NULL,
    end_at      TIMESTAMP    NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE notice_images (
    id            BIGSERIAL PRIMARY KEY,
    notice_id     BIGINT  NOT NULL REFERENCES notices (id) ON DELETE CASCADE,
    image_url     VARCHAR(500) NOT NULL,
    display_order INTEGER NOT NULL
);
