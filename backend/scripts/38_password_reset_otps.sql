-- OTP numérico de 6 dígitos para recuperação de senha (gerado no backend com SecureRandom).

CREATE TABLE IF NOT EXISTS password_reset_otps (
    id                      UUID PRIMARY KEY,
    user_id                 UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone                   VARCHAR(50) NOT NULL,
    otp_code                VARCHAR(6)  NOT NULL,
    expires_at              TIMESTAMP   NOT NULL,
    verified_at             TIMESTAMP,
    reset_token             UUID,
    reset_token_expires_at  TIMESTAMP,
    used                    BOOLEAN     NOT NULL DEFAULT FALSE,
    verify_attempts         INT         NOT NULL DEFAULT 0,
    created_at              TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_reset_otps_phone_active
    ON password_reset_otps (phone, used, expires_at DESC);

CREATE INDEX IF NOT EXISTS idx_password_reset_otps_reset_token
    ON password_reset_otps (reset_token, used, reset_token_expires_at);
