CREATE TABLE admin_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_user_id UUID REFERENCES auth.users(id),
    action VARCHAR(255) NOT NULL,
    target_user_id UUID REFERENCES auth.users(id),
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);