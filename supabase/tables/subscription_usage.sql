CREATE TABLE subscription_usage (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    month VARCHAR(7) NOT NULL,
    invoices_created INTEGER DEFAULT 0,
    api_calls INTEGER DEFAULT 0,
    team_members INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id,
    month)
);