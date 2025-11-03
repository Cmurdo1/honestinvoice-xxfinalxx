CREATE TABLE subscription_features (
    id SERIAL PRIMARY KEY,
    plan_type VARCHAR(50) NOT NULL UNIQUE,
    max_invoices INTEGER NOT NULL,
    max_team_members INTEGER NOT NULL,
    has_analytics BOOLEAN DEFAULT FALSE,
    has_custom_branding BOOLEAN DEFAULT FALSE,
    has_api_access BOOLEAN DEFAULT FALSE,
    has_advanced_reporting BOOLEAN DEFAULT FALSE,
    has_priority_support BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);