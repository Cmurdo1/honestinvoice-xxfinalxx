-- Migration: fix_rls_policy_ambiguous_columns
-- Created at: 1762045023


-- Drop existing policies
DROP POLICY IF EXISTS "Team members can view company invoices" ON invoices;
DROP POLICY IF EXISTS "Team members can create invoices" ON invoices;
DROP POLICY IF EXISTS "Team members can update invoices" ON invoices;

-- Recreate policies with fully qualified column names
CREATE POLICY "Team members can view company invoices"
  ON invoices FOR SELECT
  USING (
    invoices.company_id IN (
      SELECT tm.company_id
      FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
    )
  );

CREATE POLICY "Team members can create invoices"
  ON invoices FOR INSERT
  WITH CHECK (
    invoices.company_id IN (
      SELECT tm.company_id
      FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.role IN ('owner', 'admin', 'manager', 'accountant')
    )
  );

CREATE POLICY "Team members can update invoices"
  ON invoices FOR UPDATE
  USING (
    invoices.company_id IN (
      SELECT tm.company_id
      FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.role IN ('owner', 'admin', 'manager', 'accountant')
    )
  );
;