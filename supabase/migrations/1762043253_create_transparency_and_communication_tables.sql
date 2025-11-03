-- Migration: create_transparency_and_communication_tables
-- Created at: 1762043253

-- Communication logs table: omnichannel delivery and engagement
CREATE TABLE communication_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  invoice_id UUID,
  channel TEXT CHECK (channel IN ('email','portal','sms','api')),
  event_type TEXT CHECK (event_type IN ('sent','delivered','opened','clicked','replied','bounced','unsubscribed','viewed_portal')),
  direction TEXT CHECK (direction IN ('outbound','inbound')),
  subject TEXT,
  body_summary TEXT,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  portal_viewed_at TIMESTAMPTZ,
  error_code TEXT,
  error_message TEXT,
  correlation_id TEXT,
  idempotency_key TEXT,
  metadata_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (idempotency_key)
);

CREATE INDEX idx_comm_logs_invoice ON communication_logs(invoice_id);
CREATE INDEX idx_comm_logs_customer ON communication_logs(customer_id);
CREATE INDEX idx_comm_logs_event_type ON communication_logs(event_type);
CREATE INDEX idx_comm_logs_times ON communication_logs(delivered_at, opened_at, clicked_at);
CREATE INDEX idx_comm_logs_company_id ON communication_logs(company_id);

-- Transparency scores table: per-invoice transparency metrics
CREATE TABLE transparency_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL,
  invoice_id UUID NOT NULL,
  score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
  fee_transparency INT NOT NULL CHECK (fee_transparency BETWEEN 0 AND 10),
  itemization_clarity INT NOT NULL CHECK (itemization_clarity BETWEEN 0 AND 10),
  fee_fairness_justification INT NOT NULL CHECK (fee_fairness_justification BETWEEN 0 AND 10),
  documentation_completeness INT NOT NULL CHECK (documentation_completeness BETWEEN 0 AND 10),
  explanations_provided INT NOT NULL CHECK (explanations_provided BETWEEN 0 AND 10),
  evidence_json JSONB,
  computed_at TIMESTAMPTZ DEFAULT now(),
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (invoice_id)
);

CREATE INDEX idx_transparency_scores_score ON transparency_scores(score);
CREATE INDEX idx_transparency_scores_invoice_id ON transparency_scores(invoice_id);

-- Client satisfaction table: feedback linked to invoice interactions
CREATE TABLE client_satisfaction (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL,
  invoice_id UUID,
  customer_id UUID NOT NULL,
  respondent_role TEXT CHECK (respondent_role IN ('customer_admin','approver','payer','viewer','other')),
  rating INT NOT NULL,
  nps INT CHECK (nps BETWEEN -100 AND 100),
  feedback_text TEXT,
  dispute_flag BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  consent_marketing BOOLEAN DEFAULT FALSE,
  consent_research BOOLEAN DEFAULT FALSE,
  metadata_json JSONB
);

CREATE INDEX idx_cs_invoice ON client_satisfaction(invoice_id);
CREATE INDEX idx_cs_customer ON client_satisfaction(customer_id);
CREATE INDEX idx_cs_rating ON client_satisfaction(rating);
CREATE INDEX idx_cs_nps ON client_satisfaction(nps);

-- Team members table: authorization bridge between users and companies
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT CHECK (role IN ('owner','admin','manager','accountant','viewer','guest')),
  permissions_json JSONB,
  status TEXT CHECK (status IN ('invited','active','disabled')),
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (company_id, user_id)
);

CREATE INDEX idx_team_members_role ON team_members(role);
CREATE INDEX idx_team_members_status ON team_members(status);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);

-- CMS content table: governed templates and message blocks
CREATE TABLE cms_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL,
  type TEXT CHECK (type IN ('template','asset','legal_block','message')),
  slug CITEXT NOT NULL,
  title TEXT NOT NULL,
  language_code CITEXT DEFAULT 'en',
  version INT NOT NULL DEFAULT 1,
  status TEXT CHECK (status IN ('draft','approved','archived')),
  content_json JSONB,
  published_at TIMESTAMPTZ,
  created_by_user_id UUID,
  approved_by_user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (company_id, slug, version)
);

CREATE INDEX idx_cms_content_status ON cms_content(status);
CREATE INDEX idx_cms_content_language ON cms_content(language_code);

-- Audit trails table: immutable, hash-chained evidence logs
CREATE TABLE audit_trails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  correlation_id TEXT,
  actor_type TEXT CHECK (actor_type IN ('user','system','integration')),
  actor_id UUID,
  action TEXT CHECK (action IN ('create','update','delete','status_change','approve','submit','reconcile','view')),
  event_time TIMESTAMPTZ DEFAULT now(),
  before_json JSONB,
  after_json JSONB,
  diff_json JSONB,
  evidence_refs_json JSONB,
  prev_hash TEXT,
  hash TEXT NOT NULL,
  app_version TEXT,
  request_id TEXT,
  ip_address INET
);

CREATE INDEX idx_audit_entity_time ON audit_trails(entity_type, entity_id, event_time);
CREATE INDEX idx_audit_correlation ON audit_trails(correlation_id);;