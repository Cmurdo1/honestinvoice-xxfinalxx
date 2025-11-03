-- Migration: create_core_tables
-- Created at: 1762043192

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Users table: authentication and identity
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email CITEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT NOT NULL,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret TEXT,
  status TEXT CHECK (status IN ('active','disabled','pending')) DEFAULT 'active',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_last_login_at ON users(last_login_at);

-- Companies table: tenant-level entity
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  company_code CITEXT NOT NULL,
  brand_logo_url TEXT,
  primary_color CITEXT,
  language_code CITEXT DEFAULT 'en',
  locale_code CITEXT DEFAULT 'en-US',
  support_email CITEXT NOT NULL,
  support_phone TEXT,
  support_portal_url TEXT,
  pricing_disclosure_url TEXT,
  fee_matrix_json JSONB,
  retention_policy_json JSONB,
  default_payment_terms_days INT CHECK (default_payment_terms_days >= 0) DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (tenant_id, company_code)
);

CREATE INDEX idx_companies_support_email ON companies(support_email);
CREATE INDEX idx_companies_tenant_id ON companies(tenant_id);

-- Customers table: bill-to entities
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL,
  customer_number CITEXT NOT NULL,
  name TEXT NOT NULL,
  email CITEXT NOT NULL,
  phone TEXT,
  billing_address_json JSONB,
  shipping_address_json JSONB,
  language_code CITEXT DEFAULT 'en',
  locale_code CITEXT DEFAULT 'en-US',
  payment_terms_days INT CHECK (payment_terms_days >= 0) DEFAULT 30,
  portal_enabled BOOLEAN DEFAULT TRUE,
  portal_password_hash TEXT,
  preferred_delivery_channels JSONB,
  tax_exempt BOOLEAN DEFAULT FALSE,
  tax_id_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (company_id, customer_number)
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_company_id ON customers(company_id);
CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);

-- Projects table: contextualize invoicing
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  project_code CITEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('planned','active','on_hold','completed','cancelled')),
  start_date DATE,
  end_date DATE,
  billing_model TEXT CHECK (billing_model IN ('time_and_materials','fixed_fee','milestone','retainer')),
  hourly_rate NUMERIC(18,4),
  fixed_fee NUMERIC(18,2),
  retainer_amount NUMERIC(18,2),
  po_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (customer_id, project_code),
  CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)
);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_dates ON projects(start_date, end_date);
CREATE INDEX idx_projects_customer_id ON projects(customer_id);
CREATE INDEX idx_projects_company_id ON projects(company_id);;