CREATE TABLE security_events (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) DEFAULT 'low' CHECK (severity IN ('low',
    'medium',
    'high',
    'critical')),
    description TEXT,
    ip_address VARCHAR(45),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);