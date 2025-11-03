/**
 * API v1 Endpoint for AI Agents Integration
 * Business Tier Only
 * 
 * Endpoints:
 * - GET/POST /api/v1/invoices
 * - PUT /api/v1/invoices/:id
 * - GET/POST /api/v1/customers
 * - GET /api/v1/analytics
 * - GET /api/v1/me
 */

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Missing Supabase configuration');
        }

        // Get API key from header
        const apiKey = req.headers.get('x-api-key');
        if (!apiKey) {
            return new Response(JSON.stringify({
                error: { code: 'MISSING_API_KEY', message: 'API key is required' }
            }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Hash the API key for lookup
        const encoder = new TextEncoder();
        const data = encoder.encode(apiKey);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Verify API key and get user
        const apiKeyResponse = await fetch(`${supabaseUrl}/rest/v1/api_keys?key_hash=eq.${keyHash}&is_active=eq.true&select=*`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        if (!apiKeyResponse.ok) {
            throw new Error('Failed to verify API key');
        }

        const apiKeys = await apiKeyResponse.json();
        if (apiKeys.length === 0) {
            return new Response(JSON.stringify({
                error: { code: 'INVALID_API_KEY', message: 'Invalid or inactive API key' }
            }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const apiKeyRecord = apiKeys[0];
        const userId = apiKeyRecord.user_id;

        // Check if user has Business tier subscription
        const subResponse = await fetch(`${supabaseUrl}/rest/v1/honestinvoice_subscriptions?user_id=eq.${userId}&status=eq.active&select=*,honestinvoice_plans!inner(plan_type)`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        if (!subResponse.ok) {
            throw new Error('Failed to check subscription');
        }

        const subscriptions = await subResponse.json();
        if (subscriptions.length === 0 || subscriptions[0].honestinvoice_plans.plan_type !== 'business') {
            return new Response(JSON.stringify({
                error: { 
                    code: 'BUSINESS_TIER_REQUIRED', 
                    message: 'API access requires an active Business tier subscription' 
                }
            }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Update last_used_at for API key
        await fetch(`${supabaseUrl}/rest/v1/api_keys?id=eq.${apiKeyRecord.id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ last_used_at: new Date().toISOString() })
        });

        // Parse URL path
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/').filter(p => p);
        const endpoint = pathParts[pathParts.length - 1];

        // Route to appropriate handler
        if (endpoint === 'invoices') {
            if (req.method === 'GET') {
                return await getInvoices(userId, url.searchParams, supabaseUrl, serviceRoleKey, corsHeaders);
            } else if (req.method === 'POST') {
                const body = await req.json();
                return await createInvoice(userId, body, supabaseUrl, serviceRoleKey, corsHeaders);
            }
        } else if (endpoint.match(/^[0-9]+$/) && pathParts[pathParts.length - 2] === 'invoices') {
            if (req.method === 'PUT') {
                const invoiceId = endpoint;
                const body = await req.json();
                return await updateInvoice(userId, invoiceId, body, supabaseUrl, serviceRoleKey, corsHeaders);
            }
        } else if (endpoint === 'customers') {
            if (req.method === 'GET') {
                return await getCustomers(userId, url.searchParams, supabaseUrl, serviceRoleKey, corsHeaders);
            } else if (req.method === 'POST') {
                const body = await req.json();
                return await createCustomer(userId, body, supabaseUrl, serviceRoleKey, corsHeaders);
            }
        } else if (endpoint === 'analytics') {
            return await getAnalytics(userId, url.searchParams, supabaseUrl, serviceRoleKey, corsHeaders);
        } else if (endpoint === 'me') {
            return await getUserInfo(userId, supabaseUrl, serviceRoleKey, corsHeaders);
        }

        return new Response(JSON.stringify({
            error: { code: 'NOT_FOUND', message: 'Endpoint not found' }
        }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            error: { code: 'API_ERROR', message: error.message }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Helper functions

async function getInvoices(userId: string, params: URLSearchParams, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    const limit = params.get('limit') || '50';
    const offset = params.get('offset') || '0';
    const status = params.get('status');

    let query = `${supabaseUrl}/rest/v1/invoices?user_id=eq.${userId}&select=*&limit=${limit}&offset=${offset}`;
    if (status) {
        query += `&status=eq.${status}`;
    }

    const response = await fetch(query, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    const data = await response.json();
    return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function createInvoice(userId: string, body: any, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    body.user_id = userId;
    body.created_at = new Date().toISOString();

    const response = await fetch(`${supabaseUrl}/rest/v1/invoices`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(body)
    });

    const data = await response.json();
    return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.ok ? 201 : 400
    });
}

async function updateInvoice(userId: string, invoiceId: string, body: any, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    body.updated_at = new Date().toISOString();

    const response = await fetch(`${supabaseUrl}/rest/v1/invoices?id=eq.${invoiceId}&user_id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(body)
    });

    const data = await response.json();
    return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function getCustomers(userId: string, params: URLSearchParams, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    const limit = params.get('limit') || '50';
    const offset = params.get('offset') || '0';

    const response = await fetch(`${supabaseUrl}/rest/v1/customers?user_id=eq.${userId}&select=*&limit=${limit}&offset=${offset}`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    const data = await response.json();
    return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function createCustomer(userId: string, body: any, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    body.user_id = userId;
    body.created_at = new Date().toISOString();

    const response = await fetch(`${supabaseUrl}/rest/v1/customers`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(body)
    });

    const data = await response.json();
    return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.ok ? 201 : 400
    });
}

async function getAnalytics(userId: string, params: URLSearchParams, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    // Get analytics data
    const response = await fetch(`${supabaseUrl}/rest/v1/invoices?user_id=eq.${userId}&select=status,grand_total,created_at`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    const invoices = await response.json();

    const analytics = {
        total_invoices: invoices.length,
        total_revenue: invoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.grand_total || 0), 0),
        paid_invoices: invoices.filter((inv: any) => inv.status === 'paid').length,
        pending_invoices: invoices.filter((inv: any) => ['sent', 'viewed'].includes(inv.status)).length
    };

    return new Response(JSON.stringify({ data: analytics }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function getUserInfo(userId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    const response = await fetch(`${supabaseUrl}/rest/v1/honestinvoice_subscriptions?user_id=eq.${userId}&status=eq.active&select=*,honestinvoice_plans(*)`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    const subscriptions = await response.json();
    const subscription = subscriptions[0] || null;

    return new Response(JSON.stringify({
        data: {
            user_id: userId,
            subscription: subscription ? {
                plan_type: subscription.honestinvoice_plans.plan_type,
                status: subscription.status,
                current_period_end: subscription.current_period_end
            } : null,
            api_access: subscription && subscription.honestinvoice_plans.plan_type === 'business'
        }
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}
