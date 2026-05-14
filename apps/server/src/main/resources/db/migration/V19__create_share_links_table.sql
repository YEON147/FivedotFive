CREATE TABLE share_links
(
    id           BIGSERIAL PRIMARY KEY,
    short_code   VARCHAR(20)   NOT NULL UNIQUE,
    original_url VARCHAR(2048) NOT NULL,
    expires_at   TIMESTAMP     NOT NULL,
    created_at   TIMESTAMP     NOT NULL DEFAULT now()
);

CREATE INDEX idx_share_links_short_code ON share_links (short_code);
