/**
 * Admin Dashboard Data Endpoint
 * RESTRICTED: murdochcpm_08@yahoo.com ONLY
 * 
 * Features:
 * - User management (view users, subscriptions, activity)
 * - Subscription oversight (payment status, churn tracking)
 * - System metrics (API usage, system health, traffic analytics)
 * - Invoice monitoring (create, edit, delete, status tracking)
 */

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
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Missing Supabase configuration');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({
                error: { code: 'UNAUTHORIZED', message: 'Authorization required' }
            }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify token and get user
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            return new Response(JSON.stringify({
                error: { code: 'INVALID_TOKEN', message: 'Invalid authentication token' }
            }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const userData = await userResponse.json();
        const userId = userData.id;
        const userEmail = userData.email;

        // Verify admin access - ONLY murdochcpm_08@yahoo.com
        if (userEmail !== 'murdochcpm_08@yahoo.com') {
            await logAdminAction('unauthorized_access_attempt', userId, null, { email: userEmail }, 
                req.headers.get('x-forwarded-for') || 'unknown', supabaseUrl, serviceRoleKey);

            return new Response(JSON.stringify({
                error: { code: 'FORBIDDEN', message: 'Admin access denied' }
            }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Parse request
        const url = new URL(req.url);
        const action = url.searchParams.get('action') || 'dashboard';

        // Route to appropriate handler
        switch (action) {
            case 'dashboard':
                return await getDashboardStats(userId, supabaseUrl, serviceRoleKey, corsHeaders);
            case 'users':
                return await getUsersList(userId, url.searchParams, supabaseUrl, serviceRoleKey, corsHeaders);
            case 'subscriptions':
                return await getSubscriptionsList(userId, url.searchParams, supabaseUrl, serviceRoleKey, corsHeaders);
            case 'system_metrics':
                return await getSystemMetrics(userId, supabaseUrl, serviceRoleKey, corsHeaders);
            case 'invoices':
                return await getInvoicesList(userId, url.searchParams, supabaseUrl, serviceRoleKey, corsHeaders);
            case 'security_events':
                return await getSecurityEvents(userId, url.searchParams, supabaseUrl, serviceRoleKey, corsHeaders);
            default:
                return new Response(JSON.stringify({
                    error: { code: 'INVALID_ACTION', message: 'Invalid action specified' }
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
        }

    } catch (error) {
        return new Response(JSON.stringify({
            error: { code: 'ADMIN_DASHBOARD_ERROR', message: error.message }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

async function getDashboardStats(adminId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    // Get total users
    const usersResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });
    const users = await usersResponse.json();
    const totalUsers = users.users ? users.users.length : 0;

    // Get subscriptions
    const subsResponse = await fetch(`${supabaseUrl}/rest/v1/honestinvoice_subscriptions?select=*,honestinvoice_plans(plan_type,price)`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });
    const subscriptions = await subsResponse.json();

    // Get invoices
    const invoicesResponse = await fetch(`${supabaseUrl}/rest/v1/invoices?select=status,grand_total`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });
    const invoices = await invoicesResponse.json();

    // Get API usage
    const apiUsageResponse = await fetch(`${supabaseUrl}/rest/v1/rate_limits?select=request_count,tier`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });
    const apiUsage = await apiUsageResponse.json();

    const stats = {
        users: {
            total: totalUsers,
            free: subscriptions.filter((s: any) => s.honestinvoice_plans?.plan_type === 'free').length,
            pro: subscriptions.filter((s: any) => s.honestinvoice_plans?.plan_type === 'pro').length,
            business: subscriptions.filter((s: any) => s.honestinvoice_plans?.plan_type === 'business').length
        },
        subscriptions: {
            total: subscriptions.length,
            active: subscriptions.filter((s: any) => s.status === 'active').length,
            canceled: subscriptions.filter((s: any) => s.status === 'canceled').length,
            revenue: subscriptions
                .filter((s: any) => s.status === 'active')
                .reduce((sum: number, s: any) => sum + (s.honestinvoice_plans?.price || 0), 0) / 100
        },
        invoices: {
            total: invoices.length,
            paid: invoices.filter((i: any) => i.status === 'paid').length,
            pending: invoices.filter((i: any) => ['sent', 'viewed'].includes(i.status)).length,
            total_revenue: invoices
                .filter((i: any) => i.status === 'paid')
                .reduce((sum: number, i: any) => sum + parseFloat(i.grand_total || 0), 0)
        },
        api_usage: {
            total_requests: apiUsage.reduce((sum: number, r: any) => sum + (r.request_count || 0), 0),
            by_tier: {
                free: apiUsage.filter((r: any) => r.tier === 'free').reduce((sum: number, r: any) => sum + r.request_count, 0),
                pro: apiUsage.filter((r: any) => r.tier === 'pro').reduce((sum: number, r: any) => sum + r.request_count, 0),
                business: apiUsage.filter((r: any) => r.tier === 'business').reduce((sum: number, r: any) => sum + r.request_count, 0)
            }
        }
    };

    await logAdminAction('view_dashboard', adminId, null, stats, 
        'system', supabaseUrl, serviceRoleKey);

    return new Response(JSON.stringify({ data: stats }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function getUsersList(adminId: string, params: URLSearchParams, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    const limit = params.get('limit') || '50';
    const offset = params.get('offset') || '0';

    const usersResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });
    const allUsers = await usersResponse.json();

    // Get subscriptions for these users
    const subsResponse = await fetch(`${supabaseUrl}/rest/v1/honestinvoice_subscriptions?select=*,honestinvoice_plans(plan_type,price)`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });
    const subscriptions = await subsResponse.json();

    const users = (allUsers.users || []).slice(parseInt(offset), parseInt(offset) + parseInt(limit)).map((user: any) => {
        const subscription = subscriptions.find((s: any) => s.user_id === user.id);
        return {
            id: user.id,
            email: user.email,
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at,
            subscription: subscription ? {
                plan_type: subscription.honestinvoice_plans?.plan_type || 'free',
                status: subscription.status
            } : { plan_type: 'free', status: 'inactive' }
        };
    });

    await logAdminAction('view_users', adminId, null, { count: users.length }, 
        'system', supabaseUrl, serviceRoleKey);

    return new Response(JSON.stringify({ data: users, total: allUsers.users?.length || 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function getSubscriptionsList(adminId: string, params: URLSearchParams, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    const limit = params.get('limit') || '50';
    const offset = params.get('offset') || '0';

    const response = await fetch(`${supabaseUrl}/rest/v1/honestinvoice_subscriptions?select=*,honestinvoice_plans(*)&limit=${limit}&offset=${offset}&order=created_at.desc`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    const subscriptions = await response.json();

    await logAdminAction('view_subscriptions', adminId, null, { count: subscriptions.length }, 
        'system', supabaseUrl, serviceRoleKey);

    return new Response(JSON.stringify({ data: subscriptions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function getSystemMetrics(adminId: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    // Get rate limit data
    const rateLimitsResponse = await fetch(`${supabaseUrl}/rest/v1/rate_limits?select=*&order=created_at.desc&limit=1000`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });
    const rateLimits = await rateLimitsResponse.json();

    // Get security events
    const securityResponse = await fetch(`${supabaseUrl}/rest/v1/security_events?select=*&order=created_at.desc&limit=100`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });
    const securityEvents = await securityResponse.json();

    const metrics = {
        api_usage: {
            total_requests: rateLimits.reduce((sum: number, r: any) => sum + (r.request_count || 0), 0),
            requests_by_tier: {
                free: rateLimits.filter((r: any) => r.tier === 'free').reduce((sum: number, r: any) => sum + r.request_count, 0),
                pro: rateLimits.filter((r: any) => r.tier === 'pro').reduce((sum: number, r: any) => sum + r.request_count, 0),
                business: rateLimits.filter((r: any) => r.tier === 'business').reduce((sum: number, r: any) => sum + r.request_count, 0)
            }
        },
        security: {
            total_events: securityEvents.length,
            by_severity: {
                critical: securityEvents.filter((e: any) => e.severity === 'critical').length,
                warning: securityEvents.filter((e: any) => e.severity === 'warning').length,
                info: securityEvents.filter((e: any) => e.severity === 'info').length
            },
            recent_events: securityEvents.slice(0, 10)
        }
    };

    await logAdminAction('view_system_metrics', adminId, null, metrics, 
        'system', supabaseUrl, serviceRoleKey);

    return new Response(JSON.stringify({ data: metrics }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function getInvoicesList(adminId: string, params: URLSearchParams, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    const limit = params.get('limit') || '50';
    const offset = params.get('offset') || '0';
    const status = params.get('status');

    let query = `${supabaseUrl}/rest/v1/invoices?select=*&limit=${limit}&offset=${offset}&order=created_at.desc`;
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

    const invoices = await response.json();

    await logAdminAction('view_invoices', adminId, null, { count: invoices.length, status }, 
        'system', supabaseUrl, serviceRoleKey);

    return new Response(JSON.stringify({ data: invoices }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function getSecurityEvents(adminId: string, params: URLSearchParams, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    const limit = params.get('limit') || '100';
    const severity = params.get('severity');

    let query = `${supabaseUrl}/rest/v1/security_events?select=*&limit=${limit}&order=created_at.desc`;
    if (severity) {
        query += `&severity=eq.${severity}`;
    }

    const response = await fetch(query, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    const events = await response.json();

    return new Response(JSON.stringify({ data: events }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function logAdminAction(
    action: string,
    adminUserId: string,
    targetUserId: string | null,
    details: any,
    ipAddress: string,
    supabaseUrl: string,
    serviceRoleKey: string
) {
    await fetch(`${supabaseUrl}/rest/v1/admin_audit_logs`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            admin_user_id: adminUserId,
            action,
            target_user_id: targetUserId,
            details,
            ip_address: ipAddress,
            created_at: new Date().toISOString()
        })
    });
}
