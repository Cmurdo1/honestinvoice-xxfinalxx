Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        // Parse request body once and extract all possible parameters
        const requestData = await req.json();
        const { 
            invoice_id, 
            amount, 
            currency_code = 'usd', 
            customer_email, 
            action,
            payment_intent_id,
            payment_method,
            tenant_id,
            company_id
        } = requestData;

        console.log('Payment request received:', { invoice_id, amount, currency_code, action });

        // Get environment variables
        const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Handle different actions: create_intent, confirm_payment, or direct payment
        if (action === 'create_intent') {
            // Stripe payment intent creation
            if (!stripeSecretKey) {
                console.error('Stripe secret key not found - using mock payment');
                throw new Error('Stripe not configured - contact administrator');
            }

            // Validate required parameters
            if (!invoice_id || !amount || amount <= 0) {
                throw new Error('Valid invoice_id and amount are required');
            }

            // Get invoice details
            const invoiceResponse = await fetch(`${supabaseUrl}/rest/v1/invoices?id=eq.${invoice_id}&select=*`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (!invoiceResponse.ok) {
                throw new Error('Invoice not found');
            }

            const [invoice] = await invoiceResponse.json();

            if (!invoice) {
                throw new Error('Invoice not found');
            }

            console.log('Invoice found:', invoice.invoice_number);

            // Prepare Stripe payment intent
            const stripeParams = new URLSearchParams();
            stripeParams.append('amount', Math.round(Number(amount) * 100).toString()); // Convert to cents
            stripeParams.append('currency', currency_code.toLowerCase());
            stripeParams.append('payment_method_types[]', 'card');
            stripeParams.append('metadata[invoice_id]', invoice_id.toString());
            stripeParams.append('metadata[invoice_number]', invoice.invoice_number);
            stripeParams.append('metadata[tenant_id]', invoice.tenant_id);
            stripeParams.append('metadata[company_id]', invoice.company_id);
            
            if (customer_email) {
                stripeParams.append('receipt_email', customer_email);
            }

            // Create payment intent with Stripe
            const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${stripeSecretKey}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: stripeParams.toString()
            });

            console.log('Stripe API response status:', stripeResponse.status);

            if (!stripeResponse.ok) {
                const errorData = await stripeResponse.text();
                console.error('Stripe API error:', errorData);
                throw new Error(`Stripe API error: ${errorData}`);
            }

            const paymentIntent = await stripeResponse.json();
            console.log('Payment intent created successfully:', paymentIntent.id);

            return new Response(JSON.stringify({
                data: {
                    clientSecret: paymentIntent.client_secret,
                    paymentIntentId: paymentIntent.id,
                    amount: amount,
                    currency: currency_code
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else if (action === 'confirm_payment') {
            // Confirm payment and update invoice
            // payment_intent_id and payment_method already extracted from requestData
            if (!payment_intent_id) {
                throw new Error('payment_intent_id is required');
            }

            // Get invoice details
            const invoiceResponse = await fetch(`${supabaseUrl}/rest/v1/invoices?id=eq.${invoice_id}&select=*`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (!invoiceResponse.ok) {
                throw new Error('Invoice not found');
            }

            const [invoice] = await invoiceResponse.json();

            if (!invoice) {
                throw new Error('Invoice not found');
            }

            // Create payment record
            const payment = {
                tenant_id: invoice.tenant_id,
                company_id: invoice.company_id,
                invoice_id: invoice_id,
                payment_method: payment_method || 'stripe',
                gateway: 'stripe',
                gateway_transaction_id: payment_intent_id,
                status: 'succeeded',
                amount: Number(amount).toFixed(2),
                currency_code: currency_code,
                processed_at: new Date().toISOString(),
                net_amount: Number(amount).toFixed(2)
            };

            const paymentInsertResponse = await fetch(`${supabaseUrl}/rest/v1/payments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(payment)
            });

            if (!paymentInsertResponse.ok) {
                const errorText = await paymentInsertResponse.text();
                throw new Error(`Payment creation failed: ${errorText}`);
            }

            const [createdPayment] = await paymentInsertResponse.json();

            // Update invoice balance
            const newBalance = Number(invoice.balance_due) - Number(amount);
            let newStatus = invoice.status;
            
            if (newBalance <= 0.01) {
                newStatus = 'paid';
            } else if (newBalance < Number(invoice.grand_total)) {
                newStatus = 'partial_paid';
            }

            const invoiceUpdateResponse = await fetch(`${supabaseUrl}/rest/v1/invoices?id=eq.${invoice_id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    balance_due: Math.max(0, newBalance).toFixed(2),
                    status: newStatus,
                    paid_at: newStatus === 'paid' ? new Date().toISOString() : invoice.paid_at
                })
            });

            if (!invoiceUpdateResponse.ok) {
                throw new Error('Failed to update invoice balance');
            }

            const [updatedInvoice] = await invoiceUpdateResponse.json();

            // Log communication
            await fetch(`${supabaseUrl}/rest/v1/communication_logs`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tenant_id: invoice.tenant_id,
                    company_id: invoice.company_id,
                    customer_id: invoice.customer_id,
                    invoice_id: invoice_id,
                    channel: 'stripe',
                    event_type: 'sent',
                    direction: 'inbound',
                    subject: 'Payment Received',
                    body_summary: `Payment of ${currency_code} ${amount} processed via Stripe (${payment_intent_id})`
                })
            });

            return new Response(JSON.stringify({
                data: {
                    payment: createdPayment,
                    invoice: updatedInvoice
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } else {
            // Legacy direct payment (non-Stripe) - fallback for testing
            // tenant_id, company_id, payment_method already extracted from requestData

            // Get invoice to validate amount and update balance
            const invoiceResponse = await fetch(`${supabaseUrl}/rest/v1/invoices?id=eq.${invoice_id}`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (!invoiceResponse.ok) {
                throw new Error('Invoice not found');
            }

            const [invoice] = await invoiceResponse.json();

            if (!invoice) {
                throw new Error('Invoice not found');
            }

            // Create payment record (non-Stripe)
            const payment = {
                tenant_id: tenant_id || invoice.tenant_id,
                company_id: company_id || invoice.company_id,
                invoice_id,
                payment_method: payment_method || 'other',
                gateway: 'other',
                gateway_transaction_id: `TXN-${Date.now()}`,
                status: 'succeeded',
                amount: Number(amount).toFixed(2),
                currency_code: currency_code || 'USD',
                processed_at: new Date().toISOString(),
                net_amount: Number(amount).toFixed(2)
            };

            const paymentInsertResponse = await fetch(`${supabaseUrl}/rest/v1/payments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(payment)
            });

            if (!paymentInsertResponse.ok) {
                const errorText = await paymentInsertResponse.text();
                throw new Error(`Payment creation failed: ${errorText}`);
            }

            const [createdPayment] = await paymentInsertResponse.json();

            // Update invoice balance
            const newBalance = Number(invoice.balance_due) - Number(amount);
            let newStatus = invoice.status;
            
            if (newBalance <= 0.01) {
                newStatus = 'paid';
            } else if (newBalance < Number(invoice.grand_total)) {
                newStatus = 'partial_paid';
            }

            const invoiceUpdateResponse = await fetch(`${supabaseUrl}/rest/v1/invoices?id=eq.${invoice_id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    balance_due: Math.max(0, newBalance).toFixed(2),
                    status: newStatus,
                    paid_at: newStatus === 'paid' ? new Date().toISOString() : invoice.paid_at
                })
            });

            if (!invoiceUpdateResponse.ok) {
                throw new Error('Failed to update invoice balance');
            }

            const [updatedInvoice] = await invoiceUpdateResponse.json();

            // Log communication
            await fetch(`${supabaseUrl}/rest/v1/communication_logs`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tenant_id: invoice.tenant_id,
                    company_id: invoice.company_id,
                    customer_id: invoice.customer_id,
                    invoice_id,
                    channel: 'api',
                    event_type: 'sent',
                    direction: 'inbound',
                    subject: 'Payment Received',
                    body_summary: `Payment of ${currency_code} ${amount} processed successfully`
                })
            });

            return new Response(JSON.stringify({
                data: {
                    payment: createdPayment,
                    invoice: updatedInvoice
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

    } catch (error) {
        console.error('Process payment error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'PAYMENT_PROCESSING_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
