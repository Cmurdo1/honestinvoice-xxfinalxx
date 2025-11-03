-- Migration: enable_row_level_security
-- Created at: 1762043286

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transparency_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_satisfaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trails ENABLE ROW LEVEL SECURITY;

-- Create policies for users table (accessible by authenticated users for their own data)
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Create policies for companies (accessible by team members of the company)
CREATE POLICY "Team members can view their companies" ON companies
  FOR SELECT USING (
    id IN (SELECT company_id FROM team_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Admins and owners can update companies" ON companies
  FOR UPDATE USING (
    id IN (
      SELECT company_id FROM team_members 
      WHERE user_id = auth.uid() 
      AND status = 'active' 
      AND role IN ('owner', 'admin')
    )
  );

-- Create policies for customers (accessible by company team members)
CREATE POLICY "Team members can view company customers" ON customers
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM team_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Team members can create customers" ON customers
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM team_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
      AND role IN ('owner', 'admin', 'manager', 'accountant')
    )
  );

CREATE POLICY "Team members can update customers" ON customers
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM team_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
      AND role IN ('owner', 'admin', 'manager', 'accountant')
    )
  );

-- Create policies for projects
CREATE POLICY "Team members can view company projects" ON projects
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM team_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Team members can create projects" ON projects
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM team_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
      AND role IN ('owner', 'admin', 'manager', 'accountant')
    )
  );

CREATE POLICY "Team members can update projects" ON projects
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM team_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
      AND role IN ('owner', 'admin', 'manager', 'accountant')
    )
  );

-- Create policies for invoices
CREATE POLICY "Team members can view company invoices" ON invoices
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM team_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Team members can create invoices" ON invoices
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM team_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
      AND role IN ('owner', 'admin', 'manager', 'accountant')
    )
  );

CREATE POLICY "Team members can update invoices" ON invoices
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM team_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
      AND role IN ('owner', 'admin', 'manager', 'accountant')
    )
  );

-- Create policies for invoice_items
CREATE POLICY "Team members can view invoice items" ON invoice_items
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE company_id IN (
        SELECT company_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

CREATE POLICY "Team members can create invoice items" ON invoice_items
  FOR INSERT WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices WHERE company_id IN (
        SELECT company_id FROM team_members 
        WHERE user_id = auth.uid() 
        AND status = 'active'
        AND role IN ('owner', 'admin', 'manager', 'accountant')
      )
    )
  );

-- Create policies for payments
CREATE POLICY "Team members can view company payments" ON payments
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM team_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Team members can create payments" ON payments
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM team_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
      AND role IN ('owner', 'admin', 'manager', 'accountant')
    )
  );

-- Create policies for other tables following the same pattern
CREATE POLICY "Team members can view communication logs" ON communication_logs
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM team_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Team members can view transparency scores" ON transparency_scores
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM team_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Team members can view client satisfaction" ON client_satisfaction
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM team_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Team members can view team members" ON team_members
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM team_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Team members can view cms content" ON cms_content
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM team_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Team members can view audit trails" ON audit_trails
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM companies WHERE id IN (
        SELECT company_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );;