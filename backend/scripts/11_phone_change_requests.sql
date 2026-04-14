CREATE TABLE IF NOT EXISTS phone_change_requests (
    id          UUID PRIMARY KEY,
    user_id     UUID        NOT NULL,
    new_phone   VARCHAR(50) NOT NULL,
    code        VARCHAR(10) NOT NULL,
    expires_at  TIMESTAMP   NOT NULL,
    used        BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_phone_change_requests_user
    ON phone_change_requests (user_id, new_phone, used, expires_at);

