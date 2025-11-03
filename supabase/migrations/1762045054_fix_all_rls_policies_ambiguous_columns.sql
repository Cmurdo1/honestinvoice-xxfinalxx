-- Migration: fix_all_rls_policies_ambiguous_columns
-- Created at: 1762045054


-- Fix customers table policies
DROP POLICY IF EXISTS "Team members can view company customers" ON customers;
DROP POLICY IF EXISTS "Team members can create customers" ON customers;
DROP POLICY IF EXISTS "Team members can update customers" ON customers;

CREATE POLICY "Team members can view company customers"
  ON customers FOR SELECT
  USING (
    customers.company_id IN (
      SELECT tm.company_id
      FROM team_members tm
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );

CREATE POLICY "Team members can create customers"
  ON customers FOR INSERT
  WITH CHECK (
    customers.company_id IN (
      SELECT tm.company_id
      FROM team_members tm
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );

CREATE POLICY "Team members can update customers"
  ON customers FOR UPDATE
  USING (
    customers.company_id IN (
      SELECT tm.company_id
      FROM team_members tm
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );

-- Fix projects table policies
DROP POLICY IF EXISTS "Team members can view company projects" ON projects;
DROP POLICY IF EXISTS "Team members can create projects" ON projects;
DROP POLICY IF EXISTS "Team members can update projects" ON projects;

CREATE POLICY "Team members can view company projects"
  ON projects FOR SELECT
  USING (
    projects.company_id IN (
      SELECT tm.company_id
      FROM team_members tm
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );

CREATE POLICY "Team members can create projects"
  ON projects FOR INSERT
  WITH CHECK (
    projects.company_id IN (
      SELECT tm.company_id
      FROM team_members tm
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );

CREATE POLICY "Team members can update projects"
  ON projects FOR UPDATE
  USING (
    projects.company_id IN (
      SELECT tm.company_id
      FROM team_members tm
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );

-- Fix invoice_items table policies
DROP POLICY IF EXISTS "Team members can view company invoice items" ON invoice_items;
DROP POLICY IF EXISTS "Team members can create invoice items" ON invoice_items;

CREATE POLICY "Team members can view company invoice items"
  ON invoice_items FOR SELECT
  USING (
    invoice_items.invoice_id IN (
      SELECT inv.id
      FROM invoices inv
      INNER JOIN team_members tm ON inv.company_id = tm.company_id
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );

CREATE POLICY "Team members can create invoice items"
  ON invoice_items FOR INSERT
  WITH CHECK (
    invoice_items.invoice_id IN (
      SELECT inv.id
      FROM invoices inv
      INNER JOIN team_members tm ON inv.company_id = tm.company_id
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );

-- Fix payments table policies
DROP POLICY IF EXISTS "Team members can view company payments" ON payments;
DROP POLICY IF EXISTS "Team members can create payments" ON payments;

CREATE POLICY "Team members can view company payments"
  ON payments FOR SELECT
  USING (
    payments.invoice_id IN (
      SELECT inv.id
      FROM invoices inv
      INNER JOIN team_members tm ON inv.company_id = tm.company_id
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );

CREATE POLICY "Team members can create payments"
  ON payments FOR INSERT
  WITH CHECK (
    payments.invoice_id IN (
      SELECT inv.id
      FROM invoices inv
      INNER JOIN team_members tm ON inv.company_id = tm.company_id
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );

-- Fix transparency_scores table policies
DROP POLICY IF EXISTS "Team members can view transparency scores" ON transparency_scores;
DROP POLICY IF EXISTS "System can manage transparency scores" ON transparency_scores;

CREATE POLICY "Team members can view transparency scores"
  ON transparency_scores FOR SELECT
  USING (
    transparency_scores.invoice_id IN (
      SELECT inv.id
      FROM invoices inv
      INNER JOIN team_members tm ON inv.company_id = tm.company_id
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );

CREATE POLICY "System can manage transparency scores"
  ON transparency_scores FOR ALL
  USING (true)
  WITH CHECK (true);

-- Fix communication_logs table policies
DROP POLICY IF EXISTS "Team members can view communication logs" ON communication_logs;
DROP POLICY IF EXISTS "Team members can create communication logs" ON communication_logs;

CREATE POLICY "Team members can view communication logs"
  ON communication_logs FOR SELECT
  USING (
    communication_logs.company_id IN (
      SELECT tm.company_id
      FROM team_members tm
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );

CREATE POLICY "Team members can create communication logs"
  ON communication_logs FOR INSERT
  WITH CHECK (
    communication_logs.company_id IN (
      SELECT tm.company_id
      FROM team_members tm
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );
;