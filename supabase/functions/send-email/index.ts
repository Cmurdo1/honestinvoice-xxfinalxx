/**
 * Send Email using Resend
 * Sender: support@honestinvoice.com
 * 
 * Email Types:
 * - Invoice notifications
 * - Payment receipts
 * - Subscription updates
 * - Admin alerts
 * - System notifications
 */

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!resendApiKey) {
            return new Response(JSON.stringify({
                error: { code: 'RESEND_NOT_CONFIGURED', message: 'Resend API key not configured' }
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const requestData = await req.json();
        const { to, subject, email_type, template_data } = requestData;

        if (!to || !subject || !email_type) {
            return new Response(JSON.stringify({
                error: { code: 'MISSING_PARAMS', message: 'to, subject, and email_type are required' }
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Generate HTML content based on email type
        const htmlContent = generateEmailHTML(email_type, template_data);

        // Send email via Resend
        const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'HonestInvoice <support@honestinvoice.com>',
                to: Array.isArray(to) ? to : [to],
                subject,
                html: htmlContent
            })
        });

        if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            throw new Error(`Resend API error: ${errorText}`);
        }

        const emailData = await emailResponse.json();

        // Log email send for admin monitoring
        if (email_type === 'admin_alert' && supabaseUrl && serviceRoleKey) {
            await fetch(`${supabaseUrl}/rest/v1/security_events`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event_type: 'admin_email_sent',
                    severity: 'info',
                    description: `Admin alert sent: ${subject}`,
                    metadata: { to, email_id: emailData.id },
                    created_at: new Date().toISOString()
                })
            });
        }

        return new Response(JSON.stringify({
            success: true,
            data: {
                email_id: emailData.id,
                to,
                subject
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            error: { code: 'EMAIL_SEND_ERROR', message: error.message }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

function generateEmailHTML(emailType: string, data: any): string {
    const baseStyles = `
        <style>
            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563EB 0%, #1E40AF 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
            .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #2563EB; color: white; text-decoration: none; border-radius: 6px; margin: 15px 0; }
            .info-box { background: #EFF6FF; border-left: 4px solid #2563EB; padding: 15px; margin: 15px 0; }
            .alert-box { background: #FEF2F2; border-left: 4px solid #EF4444; padding: 15px; margin: 15px 0; }
        </style>
    `;

    switch (emailType) {
        case 'invoice_notification':
            return `
                ${baseStyles}
                <div class="container">
                    <div class="header">
                        <h1>New Invoice</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${data.customer_name || 'Customer'},</p>
                        <p>You have received a new invoice from ${data.company_name || 'HonestInvoice'}.</p>
                        <div class="info-box">
                            <strong>Invoice #${data.invoice_number}</strong><br>
                            Amount: ${data.currency || '$'}${data.grand_total || '0.00'}<br>
                            Due Date: ${data.due_date || 'N/A'}
                        </div>
                        <a href="${data.invoice_url || '#'}" class="button">View Invoice</a>
                        <p>If you have any questions, please contact us at support@honestinvoice.com</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 HonestInvoice. All rights reserved.</p>
                        <p></p>
                    </div>
                </div>
            `;

        case 'payment_receipt':
            return `
                ${baseStyles}
                <div class="container">
                    <div class="header">
                        <h1>Payment Received</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${data.customer_name || 'Customer'},</p>
                        <p>Thank you for your payment!</p>
                        <div class="info-box">
                            <strong>Payment Confirmation</strong><br>
                            Invoice #${data.invoice_number}<br>
                            Amount Paid: ${data.currency || '$'}${data.amount || '0.00'}<br>
                            Payment Date: ${data.payment_date || new Date().toLocaleDateString()}<br>
                            Payment Method: ${data.payment_method || 'N/A'}
                        </div>
                        <a href="${data.receipt_url || '#'}" class="button">Download Receipt</a>
                    </div>
                    <div class="footer">
                        <p>&copy; 2025 HonestInvoice. All rights reserved.</p>
                    </div>
                </div>
            `;

        case 'subscription_update':
            return `
                ${baseStyles}
                <div class="container">
                    <div class="header">
                        <h1>Subscription Update</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${data.user_name || 'User'},</p>
                        <p>${data.message || 'Your subscription has been updated.'}</p>
                        <div class="info-box">
                            <strong>Subscription Details</strong><br>
                            Plan: ${data.plan_type || 'N/A'}<br>
                            Status: ${data.status || 'N/A'}<br>
                            ${data.next_billing_date ? `Next Billing: ${data.next_billing_date}` : ''}
                        </div>
                        <a href="https://honestinvoice.com/dashboard" class="button">Go to Dashboard</a>
                    </div>
                    <div class="footer">
                        <p>&copy; 2025 HonestInvoice. All rights reserved.</p>
                    </div>
                </div>
            `;

        case 'admin_alert':
            return `
                ${baseStyles}
                <div class="container">
                    <div class="header">
                        <h1>Admin Alert</h1>
                    </div>
                    <div class="content">
                        <p>Hello Administrator,</p>
                        <div class="alert-box">
                            <strong>${data.alert_title || 'System Alert'}</strong><br>
                            ${data.alert_message || 'An important event has occurred.'}
                        </div>
                        <p><strong>Details:</strong></p>
                        <ul>
                            ${data.details ? Object.entries(data.details).map(([key, value]) => 
                                `<li><strong>${key}:</strong> ${value}</li>`
                            ).join('') : '<li>No additional details</li>'}
                        </ul>
                        <p><strong>Timestamp:</strong> ${data.timestamp || new Date().toISOString()}</p>
                        <a href="https://honestinvoice.com/admin" class="button">View Admin Dashboard</a>
                    </div>
                    <div class="footer">
                        <p>&copy; 2025 HonestInvoice. All rights reserved.</p>
                        <p>This is an automated admin alert from HonestInvoice.</p>
                    </div>
                </div>
            `;

        case 'system_notification':
            return `
                ${baseStyles}
                <div class="container">
                    <div class="header">
                        <h1>${data.title || 'System Notification'}</h1>
                    </div>
                    <div class="content">
                        <p>${data.message || 'This is a system notification.'}</p>
                        ${data.action_url ? `<a href="${data.action_url}" class="button">${data.action_text || 'Take Action'}</a>` : ''}
                    </div>
                    <div class="footer">
                        <p>&copy; 2025 HonestInvoice. All rights reserved.</p>
                    </div>
                </div>
            `;

        default:
            return `
                ${baseStyles}
                <div class="container">
                    <div class="header">
                        <h1>HonestInvoice</h1>
                    </div>
                    <div class="content">
                        <p>${data.message || 'Thank you for using HonestInvoice.'}</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2025 HonestInvoice. All rights reserved.</p>
                    </div>
                </div>
            `;
    }
}
