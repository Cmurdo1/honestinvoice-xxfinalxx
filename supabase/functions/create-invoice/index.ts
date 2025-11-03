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
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get auth token from request
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('No authorization header');
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify user
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid token');
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        // Get user's subscription features and usage
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        
        // Get subscription and features
        const subscriptionResponse = await fetch(`${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${userId}&status=eq.active&select=*,plans(*)`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        let userPlan = 'free';
        let maxInvoices = 50; // Default for free plan
        let hasCustomTemplates = false;
        let hasAutomatedReminders = false;
        let hasAdvancedTransparency = false;

        if (subscriptionResponse.ok) {
            const subscriptions = await subscriptionResponse.json();
            if (subscriptions.length > 0) {
                const subscription = subscriptions[0];
                userPlan = subscription.plans.plan_type;
                
                // Get features for this plan
                const featuresResponse = await fetch(`${supabaseUrl}/rest/v1/subscription_features?plan_type=eq.${userPlan}`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (featuresResponse.ok) {
                    const features = await featuresResponse.json();
                    if (features.length > 0) {
                        const featureData = features[0];
                        maxInvoices = featureData.max_invoices;
                        hasCustomTemplates = featureData.has_custom_templates;
                        hasAutomatedReminders = featureData.has_automated_reminders;
                        hasAdvancedTransparency = featureData.has_advanced_transparency;
                    }
                }
            }
        }

        // Get current month's usage
        const usageResponse = await fetch(`${supabaseUrl}/rest/v1/subscription_usage?user_id=eq.${userId}&month=eq.${currentMonth}`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        let currentUsage = 0;
        if (usageResponse.ok) {
            const usageData = await usageResponse.json();
            if (usageData.length > 0) {
                currentUsage = usageData[0].invoices_created || 0;
            }
        }

        // Check if user can create invoice (respect free tier limits)
        if (maxInvoices !== -1 && currentUsage >= maxInvoices) {
            return new Response(JSON.stringify({
                error: {
                    code: 'INVOICE_LIMIT_EXCEEDED',
                    message: `You've reached your monthly invoice limit (${maxInvoices} invoices). Upgrade to ${userPlan === 'free' ? 'Pro' : 'Business'} for unlimited invoices.`,
                    currentUsage: currentUsage,
                    maxInvoices: maxInvoices,
                    planType: userPlan
                }
            }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Get request body
        const invoiceData = await req.json();
        const { tenant_id, company_id, customer_id, project_id, invoice_items, ...otherData } = invoiceData;

        // Calculate totals from invoice items
        let subtotal = 0;
        let discount_total = 0;
        let tax_total = 0;

        for (const item of invoice_items) {
            const itemSubtotal = Number(item.quantity) * Number(item.unit_price);
            subtotal += itemSubtotal;
            discount_total += Number(item.discount_amount || 0);
            tax_total += Number(item.tax_amount || 0);
        }

        const grand_total = subtotal - discount_total + tax_total;
        const balance_due = grand_total;

        // Create invoice
        const invoiceInsert = {
            tenant_id,
            company_id,
            customer_id,
            project_id: project_id || null,
            invoice_number: `INV-${Date.now()}`,
            status: 'draft',
            currency_code: 'USD',
            subtotal: subtotal.toFixed(2),
            discount_total: discount_total.toFixed(2),
            tax_total: tax_total.toFixed(2),
            grand_total: grand_total.toFixed(2),
            balance_due: balance_due.toFixed(2),
            delivery_status: 'not_sent',
            ...otherData
        };

        const invoiceResponse = await fetch(`${supabaseUrl}/rest/v1/invoices`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(invoiceInsert)
        });

        if (!invoiceResponse.ok) {
            const errorText = await invoiceResponse.text();
            throw new Error(`Invoice creation failed: ${errorText}`);
        }

        const [invoice] = await invoiceResponse.json();

        // Create invoice items
        const itemsToInsert = invoice_items.map((item: any) => ({
            tenant_id,
            invoice_id: invoice.id,
            project_id: project_id || null,
            ...item,
            line_total: ((Number(item.quantity) * Number(item.unit_price)) - Number(item.discount_amount || 0) + Number(item.tax_amount || 0)).toFixed(2)
        }));

        const itemsResponse = await fetch(`${supabaseUrl}/rest/v1/invoice_items`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(itemsToInsert)
        });

        if (!itemsResponse.ok) {
            const errorText = await itemsResponse.text();
            throw new Error(`Invoice items creation failed: ${errorText}`);
        }

        const items = await itemsResponse.json();

        // Calculate transparency score
        let transparency_score = 50; // Base score
        let fee_transparency = 5;
        let itemization_clarity = 5;
        let fee_fairness_justification = 5;
        let documentation_completeness = 5;
        let explanations_provided = 5;

        // Scoring logic
        if (invoiceData.fee_disclosure_json) fee_transparency = 10;
        if (items.length > 0) itemization_clarity = 10;
        if (items.some((i: any) => i.justification)) fee_fairness_justification = 8;
        if (invoiceData.evidence_refs_json) documentation_completeness = 8;
        if (invoiceData.terms_and_conditions) explanations_provided = 7;

        transparency_score = fee_transparency * 2 + itemization_clarity * 2 + 
                           fee_fairness_justification * 2 + documentation_completeness * 2 + 
                           explanations_provided * 2;

        // Create transparency score
        const scoreResponse = await fetch(`${supabaseUrl}/rest/v1/transparency_scores`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                tenant_id,
                company_id,
                invoice_id: invoice.id,
                score: transparency_score,
                fee_transparency,
                itemization_clarity,
                fee_fairness_justification,
                documentation_completeness,
                explanations_provided,
                evidence_json: invoiceData.evidence_refs_json || {}
            })
        });

        if (!scoreResponse.ok) {
            console.warn('Transparency score creation failed, continuing...');
        }

        // Update usage tracking
        const updatedUsage = currentUsage + 1;
        const upsertUsageResponse = await fetch(`${supabaseUrl}/rest/v1/subscription_usage`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
                user_id: userId,
                month: currentMonth,
                invoices_created: updatedUsage,
                api_calls: 0, // Will be updated by API calls
                team_members: 0 // Will be updated by team management
            })
        });

        if (!upsertUsageResponse.ok) {
            console.warn('Usage tracking update failed, but invoice creation successful');
        }

        return new Response(JSON.stringify({
            data: {
                invoice,
                items,
                transparency_score,
                usage: {
                    current: updatedUsage,
                    limit: maxInvoices,
                    planType: userPlan
                }
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Create invoice error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'INVOICE_CREATION_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
