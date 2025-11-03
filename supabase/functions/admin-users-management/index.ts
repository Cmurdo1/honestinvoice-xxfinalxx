/**
 * Admin Users Management Endpoint
 * RESTRICTED: murdochcpm_08@yahoo.com ONLY
 * 
 * Actions:
 * - View user details
 * - Update user subscription
 * - Suspend/unsuspend user
 * - Reset user password
 * - Generate API keys
 * - Revoke API keys
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

        // Verify admin access
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
        const userEmail = userData.email;

        // ONLY murdochcpm_08@yahoo.com has access
        if (userEmail !== 'murdochcpm_08@yahoo.com') {
            return new Response(JSON.stringify({
                error: { code: 'FORBIDDEN', message: 'Admin access denied' }
            }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const adminId = userData.id;
        const clientIp = req.headers.get('x-forwarded-for') || 'unknown';

        // Parse request
        const requestData = await req.json();
        const { action, user_id, data } = requestData;

        if (!action) {
            return new Response(JSON.stringify({
                error: { code: 'MISSING_ACTION', message: 'Action is required' }
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Route to appropriate action
        switch (action) {
            case 'get_user':
                return await getUserDetails(adminId, user_id, clientIp, supabaseUrl, serviceRoleKey, corsHeaders);
            case 'update_subscription':
                return await updateUserSubscription(adminId, user_id, data, clientIp, supabaseUrl, serviceRoleKey, corsHeaders);
            case 'suspend_user':
                return await suspendUser(adminId, user_id, clientIp, supabaseUrl, serviceRoleKey, corsHeaders);
            case 'unsuspend_user':
                return await unsuspendUser(adminId, user_id, clientIp, supabaseUrl, serviceRoleKey, corsHeaders);
            case 'generate_api_key':
                return await generateAPIKey(adminId, user_id, data, clientIp, supabaseUrl, serviceRoleKey, corsHeaders);
            case 'revoke_api_key':
                return await revokeAPIKey(adminId, data.api_key_id, clientIp, supabaseUrl, serviceRoleKey, corsHeaders);
            case 'list_api_keys':
                return await listAPIKeys(adminId, user_id, clientIp, supabaseUrl, serviceRoleKey, corsHeaders);
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
            error: { code: 'ADMIN_MANAGEMENT_ERROR', message: error.message }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

async function getUserDetails(adminId: string, userId: string, ipAddress: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    // Get user from auth
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (!userResponse.ok) {
        return new Response(JSON.stringify({
            error: { code: 'USER_NOT_FOUND', message: 'User not found' }
        }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const user = await userResponse.json();

    // Get subscription
    const subResponse = await fetch(`${supabaseUrl}/rest/v1/honestinvoice_subscriptions?user_id=eq.${userId}&select=*,honestinvoice_plans(*)`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });
    const subscriptions = await subResponse.json();

    // Get invoices
    const invoicesResponse = await fetch(`${supabaseUrl}/rest/v1/invoices?user_id=eq.${userId}&select=count`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });
    const invoiceCount = await invoicesResponse.json();

    // Get API keys
    const apiKeysResponse = await fetch(`${supabaseUrl}/rest/v1/api_keys?user_id=eq.${userId}&select=id,name,key_prefix,is_active,created_at,last_used_at`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });
    const apiKeys = await apiKeysResponse.json();

    const userDetails = {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        subscription: subscriptions[0] || null,
        invoice_count: invoiceCount.length,
        api_keys: apiKeys
    };

    await logAdminAction('get_user_details', adminId, userId, { user_email: user.email }, 
        ipAddress, supabaseUrl, serviceRoleKey);

    return new Response(JSON.stringify({ data: userDetails }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function generateAPIKey(adminId: string, userId: string, data: any, ipAddress: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    // Generate random API key
    const keyBytes = new Uint8Array(32);
    crypto.getRandomValues(keyBytes);
    const apiKey = 'hi_' + Array.from(keyBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    // Hash the key
    const encoder = new TextEncoder();
    const keyData = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Store in database
    const response = await fetch(`${supabaseUrl}/rest/v1/api_keys`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            user_id: userId,
            key_hash: keyHash,
            key_prefix: apiKey.substring(0, 10),
            name: data.name || 'API Key',
            is_active: true,
            created_at: new Date().toISOString()
        })
    });

    const keyRecord = await response.json();

    await logAdminAction('generate_api_key', adminId, userId, { name: data.name }, 
        ipAddress, supabaseUrl, serviceRoleKey);

    return new Response(JSON.stringify({
        data: {
            api_key: apiKey,
            key_prefix: apiKey.substring(0, 10),
            record: keyRecord[0],
            warning: 'Save this key securely. It will not be shown again.'
        }
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function revokeAPIKey(adminId: string, apiKeyId: number, ipAddress: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    const response = await fetch(`${supabaseUrl}/rest/v1/api_keys?id=eq.${apiKeyId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: false })
    });

    await logAdminAction('revoke_api_key', adminId, null, { api_key_id: apiKeyId }, 
        ipAddress, supabaseUrl, serviceRoleKey);

    return new Response(JSON.stringify({
        success: true,
        message: 'API key revoked successfully'
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function listAPIKeys(adminId: string, userId: string, ipAddress: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    const response = await fetch(`${supabaseUrl}/rest/v1/api_keys?user_id=eq.${userId}&select=id,name,key_prefix,is_active,created_at,last_used_at`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });

    const apiKeys = await response.json();

    return new Response(JSON.stringify({ data: apiKeys }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function updateUserSubscription(adminId: string, userId: string, data: any, ipAddress: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    const { plan_type } = data;

    // Get the plan
    const planResponse = await fetch(`${supabaseUrl}/rest/v1/honestinvoice_plans?plan_type=eq.${plan_type}`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        }
    });
    const plans = await planResponse.json();

    if (plans.length === 0) {
        return new Response(JSON.stringify({
            error: { code: 'INVALID_PLAN', message: 'Invalid plan type' }
        }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const plan = plans[0];

    // Update or create subscription
    const subResponse = await fetch(`${supabaseUrl}/rest/v1/honestinvoice_subscriptions?user_id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            price_id: plan.price_id,
            status: 'active',
            updated_at: new Date().toISOString()
        })
    });

    const subscription = await subResponse.json();

    await logAdminAction('update_subscription', adminId, userId, { plan_type }, 
        ipAddress, supabaseUrl, serviceRoleKey);

    return new Response(JSON.stringify({
        success: true,
        data: subscription
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function suspendUser(adminId: string, userId: string, ipAddress: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    // Disable the user's subscription
    await fetch(`${supabaseUrl}/rest/v1/honestinvoice_subscriptions?user_id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'suspended' })
    });

    await logAdminAction('suspend_user', adminId, userId, {}, ipAddress, supabaseUrl, serviceRoleKey);

    return new Response(JSON.stringify({
        success: true,
        message: 'User suspended successfully'
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function unsuspendUser(adminId: string, userId: string, ipAddress: string, supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    await fetch(`${supabaseUrl}/rest/v1/honestinvoice_subscriptions?user_id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'active' })
    });

    await logAdminAction('unsuspend_user', adminId, userId, {}, ipAddress, supabaseUrl, serviceRoleKey);

    return new Response(JSON.stringify({
        success: true,
        message: 'User unsuspended successfully'
    }), {
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
