-- Tabela para rastreio de pagamentos M-Pesa C2B
CREATE TABLE IF NOT EXISTS mpesa_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    third_party_id VARCHAR(100) NOT NULL UNIQUE,
    conversation_id VARCHAR(100),
    transaction_id VARCHAR(100),
    amount NUMERIC(10, 2) NOT NULL,
    duration_months INTEGER NOT NULL DEFAULT 1,
    customer_phone VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    mpesa_response_code VARCHAR(20),
    mpesa_response_desc VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_mpesa_payments_user ON mpesa_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_payments_status ON mpesa_payments(status);
CREATE INDEX IF NOT EXISTS idx_mpesa_payments_conversation ON mpesa_payments(conversation_id);
