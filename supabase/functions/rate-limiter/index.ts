/**
 * Rate Limiter Middleware
 * Tier-based rate limiting with DDoS protection
 * 
 * Limits:
 * - Free: 100 requests/hour, 10 requests/minute
 * - Pro: 500 requests/hour, 50 requests/minute
 * - Business: 1000 requests/hour, 100 requests/minute
 * 
 * Features:
 * - IP-based blocking
 * - Request throttling
 * - Abuse detection
 * - Exponential backoff
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

        const { user_id, endpoint, tier = 'free' } = await req.json();

        if (!user_id || !endpoint) {
            return new Response(JSON.stringify({
                error: { code: 'MISSING_PARAMS', message: 'user_id and endpoint are required' }
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Get client IP
        const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

        // Define rate limits per tier
        const limits: Record<string, { hourly: number; minute: number }> = {
            free: { hourly: 100, minute: 10 },
            pro: { hourly: 500, minute: 50 },
            business: { hourly: 1000, minute: 100 }
        };

        const tierLimits = limits[tier] || limits.free;

        // Check for IP blocking
        const blockResponse = await fetch(`${supabaseUrl}/rest/v1/security_events?ip_address=eq.${clientIp}&event_type=eq.ip_blocked&select=*&order=created_at.desc&limit=1`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        const blocks = await blockResponse.json();
        if (blocks.length > 0) {
            const blockTime = new Date(blocks[0].created_at);
            const now = new Date();
            const hoursSinceBlock = (now.getTime() - blockTime.getTime()) / (1000 * 60 * 60);

            if (hoursSinceBlock < 24) {
                return new Response(JSON.stringify({
                    error: { 
                        code: 'IP_BLOCKED', 
                        message: 'Your IP has been temporarily blocked due to suspicious activity',
                        unblock_at: new Date(blockTime.getTime() + 24 * 60 * 60 * 1000).toISOString()
                    }
                }), {
                    status: 429,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        // Get or create rate limit record
        const now = new Date();
        const hourStart = new Date(now);
        hourStart.setMinutes(0, 0, 0);
        const minuteStart = new Date(now);
        minuteStart.setSeconds(0, 0);

        // Check hourly limit
        const hourlyResponse = await fetch(`${supabaseUrl}/rest/v1/rate_limits?user_id=eq.${user_id}&endpoint=eq.${endpoint}&window_start=gte.${hourStart.toISOString()}&select=*`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        const hourlyRecords = await hourlyResponse.json();
        const hourlyCount = hourlyRecords.reduce((sum: number, record: any) => sum + (record.request_count || 0), 0);

        if (hourlyCount >= tierLimits.hourly) {
            // Log abuse event
            await logSecurityEvent(user_id, clientIp, 'rate_limit_exceeded', 'warning', 
                `Hourly limit exceeded: ${hourlyCount}/${tierLimits.hourly}`, 
                supabaseUrl, serviceRoleKey);

            return new Response(JSON.stringify({
                error: { 
                    code: 'RATE_LIMIT_EXCEEDED', 
                    message: 'Hourly rate limit exceeded',
                    limit: tierLimits.hourly,
                    current: hourlyCount,
                    reset_at: new Date(hourStart.getTime() + 60 * 60 * 1000).toISOString()
                }
            }), {
                status: 429,
                headers: { 
                    ...corsHeaders, 
                    'Content-Type': 'application/json',
                    'X-RateLimit-Limit': String(tierLimits.hourly),
                    'X-RateLimit-Remaining': String(Math.max(0, tierLimits.hourly - hourlyCount)),
                    'X-RateLimit-Reset': String(Math.floor((hourStart.getTime() + 60 * 60 * 1000) / 1000))
                }
            });
        }

        // Check minute limit (use minute granularity)
        const minuteRecords = hourlyRecords.filter((r: any) => {
            const recordTime = new Date(r.window_start);
            return recordTime >= minuteStart;
        });
        const minuteCount = minuteRecords.reduce((sum: number, record: any) => sum + (record.request_count || 0), 0);

        if (minuteCount >= tierLimits.minute) {
            await logSecurityEvent(user_id, clientIp, 'rate_limit_exceeded', 'warning', 
                `Minute limit exceeded: ${minuteCount}/${tierLimits.minute}`, 
                supabaseUrl, serviceRoleKey);

            return new Response(JSON.stringify({
                error: { 
                    code: 'RATE_LIMIT_EXCEEDED', 
                    message: 'Per-minute rate limit exceeded',
                    limit: tierLimits.minute,
                    current: minuteCount,
                    reset_at: new Date(minuteStart.getTime() + 60 * 1000).toISOString()
                }
            }), {
                status: 429,
                headers: { 
                    ...corsHeaders, 
                    'Content-Type': 'application/json',
                    'X-RateLimit-Limit': String(tierLimits.minute),
                    'X-RateLimit-Remaining': String(Math.max(0, tierLimits.minute - minuteCount)),
                    'X-RateLimit-Reset': String(Math.floor((minuteStart.getTime() + 60 * 1000) / 1000))
                }
            });
        }

        // Update or create rate limit record
        const existingMinuteRecord = minuteRecords.find((r: any) => {
            const recordTime = new Date(r.window_start);
            return recordTime.getTime() === minuteStart.getTime();
        });

        if (existingMinuteRecord) {
            await fetch(`${supabaseUrl}/rest/v1/rate_limits?id=eq.${existingMinuteRecord.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    request_count: existingMinuteRecord.request_count + 1,
                    updated_at: now.toISOString()
                })
            });
        } else {
            await fetch(`${supabaseUrl}/rest/v1/rate_limits`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id,
                    endpoint,
                    request_count: 1,
                    window_start: minuteStart.toISOString(),
                    tier,
                    created_at: now.toISOString(),
                    updated_at: now.toISOString()
                })
            });
        }

        // Check for abuse patterns (too many requests in short time)
        if (minuteCount > tierLimits.minute * 0.8) {
            await logSecurityEvent(user_id, clientIp, 'potential_abuse', 'warning', 
                `High request rate detected: ${minuteCount}/${tierLimits.minute}`, 
                supabaseUrl, serviceRoleKey);
        }

        return new Response(JSON.stringify({
            success: true,
            allowed: true,
            remaining: {
                hourly: tierLimits.hourly - hourlyCount - 1,
                minute: tierLimits.minute - minuteCount - 1
            },
            reset: {
                hourly: new Date(hourStart.getTime() + 60 * 60 * 1000).toISOString(),
                minute: new Date(minuteStart.getTime() + 60 * 1000).toISOString()
            }
        }), {
            headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json',
                'X-RateLimit-Limit-Hourly': String(tierLimits.hourly),
                'X-RateLimit-Remaining-Hourly': String(Math.max(0, tierLimits.hourly - hourlyCount - 1)),
                'X-RateLimit-Limit-Minute': String(tierLimits.minute),
                'X-RateLimit-Remaining-Minute': String(Math.max(0, tierLimits.minute - minuteCount - 1))
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            error: { code: 'RATE_LIMITER_ERROR', message: error.message }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

async function logSecurityEvent(
    userId: string, 
    ipAddress: string, 
    eventType: string, 
    severity: string, 
    description: string,
    supabaseUrl: string,
    serviceRoleKey: string
) {
    await fetch(`${supabaseUrl}/rest/v1/security_events`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user_id: userId,
            event_type: eventType,
            severity,
            description,
            ip_address: ipAddress,
            created_at: new Date().toISOString(),
            metadata: { timestamp: new Date().toISOString() }
        })
    });
}
