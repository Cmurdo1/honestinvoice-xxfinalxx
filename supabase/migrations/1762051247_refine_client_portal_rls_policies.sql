-- Migration: refine_client_portal_rls_policies
-- Created at: 1762051247

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Public can verify invoices by invoice number" ON public.invoices;
DROP POLICY IF EXISTS "Public can view transparency scores" ON public.transparency_scores;
DROP POLICY IF EXISTS "Public can view invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Public can view payments" ON public.payments;
DROP POLICY IF EXISTS "Public can view client satisfaction" ON public.client_satisfaction;
DROP POLICY IF EXISTS "Public can view communication logs" ON public.communication_logs;

-- More secure policy: Allow viewing invoices that are finalized/sent (not drafts)
CREATE POLICY "Anyone can view non-draft invoices"
ON public.invoices
FOR SELECT
TO public
USING (status != 'draft');

-- Allow viewing transparency scores for non-draft invoices
CREATE POLICY "Anyone can view transparency scores for non-draft invoices"
ON public.transparency_scores
FOR SELECT
TO public
USING (
  invoice_id IN (
    SELECT id FROM public.invoices WHERE status != 'draft'
  )
);

-- Allow viewing invoice items for non-draft invoices
CREATE POLICY "Anyone can view invoice items for non-draft invoices"
ON public.invoice_items
FOR SELECT
TO public
USING (
  invoice_id IN (
    SELECT id FROM public.invoices WHERE status != 'draft'
  )
);

-- Allow viewing payments for non-draft invoices
CREATE POLICY "Anyone can view payments for non-draft invoices"
ON public.payments
FOR SELECT
TO public
USING (
  invoice_id IN (
    SELECT id FROM public.invoices WHERE status != 'draft'
  )
);

-- Allow viewing client satisfaction for companies (aggregate data)
CREATE POLICY "Anyone can view client satisfaction"
ON public.client_satisfaction
FOR SELECT
TO public
USING (true);

-- Restrict communication logs - only team members can view
-- (already covered by existing policy)
;