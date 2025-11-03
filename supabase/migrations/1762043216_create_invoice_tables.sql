-- Migration: create_invoice_tables
-- Created at: 1762043216

-- Invoices table: invoice headers with transparency fields
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  project_id UUID,
  invoice_number CITEXT NOT NULL,
  status TEXT CHECK (status IN ('draft','approved','sent','viewed','partial_paid','paid','void','disputed')),
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  currency_code CITEXT NOT NULL,
  subtotal NUMERIC(18,2) NOT NULL,
  discount_total NUMERIC(18,2) DEFAULT 0,
  tax_total NUMERIC(18,2) DEFAULT 0,
  grand_total NUMERIC(18,2) NOT NULL,
  balance_due NUMERIC(18,2) NOT NULL CHECK (balance_due >= 0),
  terms_and_conditions TEXT,
  po_number TEXT,
  delivery_status TEXT CHECK (delivery_status IN ('not_sent','sent','delivered','portal_viewed')),
  portal_viewed_at TIMESTAMPTZ,
  fee_disclosure_json JSONB,
  tax_disclosure_json JSONB,
  evidence_refs_json JSONB,
  invoice_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (company_id, invoice_number)
);

CREATE INDEX idx_invoices_status_dates ON invoices(status, issue_date, due_date);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_project ON invoices(project_id);
CREATE INDEX idx_invoices_company_id ON invoices(company_id);
CREATE INDEX idx_invoices_tenant_id ON invoices(tenant_id);

-- Invoice items table: line-level detail
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  invoice_id UUID NOT NULL,
  project_id UUID,
  item_type TEXT CHECK (item_type IN ('time','expense','fee','adjustment','deposit')),
  description TEXT NOT NULL,
  quantity NUMERIC(18,4) DEFAULT 1 CHECK (quantity >= 0),
  unit_price NUMERIC(18,4) NOT NULL,
  discount_amount NUMERIC(18,2) DEFAULT 0,
  tax_amount NUMERIC(18,2) DEFAULT 0,
  line_total NUMERIC(18,2) NOT NULL,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  justification TEXT,
  is_billable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_project ON invoice_items(project_id);
CREATE INDEX idx_invoice_items_item_type ON invoice_items(item_type);
CREATE INDEX idx_invoice_items_dates ON invoice_items(start_at, end_at);

-- Payments table: reconcile payments to invoices
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  company_id UUID NOT NULL,
  invoice_id UUID NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('card','ach','bank_transfer','check','cash','other')),
  gateway TEXT CHECK (gateway IN ('stripe','adyen','paypal','other')),
  gateway_transaction_id TEXT,
  gateway_payment_id TEXT,
  status TEXT CHECK (status IN ('initiated','pending','succeeded','failed','refunded','charged_back')),
  amount NUMERIC(18,2) NOT NULL CHECK (amount >= 0),
  currency_code CITEXT NOT NULL,
  processed_at TIMESTAMPTZ,
  refunded_amount NUMERIC(18,2) DEFAULT 0,
  fee_amount NUMERIC(18,2) DEFAULT 0,
  net_amount NUMERIC(18,2),
  receipt_url TEXT,
  metadata_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (gateway, gateway_transaction_id)
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_gateway_ids ON payments(gateway, gateway_transaction_id);
CREATE INDEX idx_payments_status_processed ON payments(status, processed_at);
CREATE INDEX idx_payments_company_id ON payments(company_id);;