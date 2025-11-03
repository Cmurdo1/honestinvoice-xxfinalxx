-- Migration: add_client_portal_rls_policies
-- Created at: 1762051229

-- Add policy for public invoice verification by invoice number
CREATE POLICY "Public can verify invoices by invoice number"
ON public.invoices
FOR SELECT
TO public
USING (true);

-- Add policy for public access to transparency scores
CREATE POLICY "Public can view transparency scores"
ON public.transparency_scores
FOR SELECT
TO public
USING (true);

-- Add policy for customers to view their own invoices
CREATE POLICY "Customers can view their own invoices"
ON public.invoices
FOR SELECT
TO public
USING (
  customer_id IN (
    SELECT c.id
    FROM customers c
    WHERE c.email = (SELECT auth.email() FROM auth.users WHERE auth.uid() = auth.uid())
  )
);

-- Add policy for public to view invoice items (needed for invoice details)
CREATE POLICY "Public can view invoice items"
ON public.invoice_items
FOR SELECT
TO public
USING (true);

-- Add policy for public to view payments (needed for payment history)
CREATE POLICY "Public can view payments"
ON public.payments
FOR SELECT
TO public  
USING (true);

-- Add policy for public to view client satisfaction
CREATE POLICY "Public can view client satisfaction"
ON public.client_satisfaction
FOR SELECT
TO public
USING (true);

-- Add policy for public to view communication logs
CREATE POLICY "Public can view communication logs"
ON public.communication_logs
FOR SELECT
TO public
USING (true);
;