# HonestInvoice.com - Cloudflare Pages Production Deployment Guide

## Overview

This guide walks through deploying HonestInvoice to Cloudflare Pages with the custom domain HonestInvoice.com.

**Production URL**: https://honestinvoice.com
**Preview URL**: https://honestinvoice.pages.dev

---

## Prerequisites

1. Cloudflare account with Pages enabled
2. Custom domain registered (honestinvoice.com)
3. GitHub repository with HonestInvoice code
4. Supabase project configured
5. Stripe account with API keys

---

## Part 1: Initial Cloudflare Pages Setup

### Step 1: Connect GitHub Repository

1. Log in to Cloudflare Dashboard
2. Navigate to **Workers & Pages**
3. Click **Create application** > **Pages** > **Connect to Git**
4. Select your GitHub repository
5. Click **Begin setup**

### Step 2: Configure Build Settings

**Framework preset**: None (Vite)

**Build configurations**:
```
Build command: npm install && npm run build
Build output directory: dist
Root directory: /
```

**Environment variables** (click Add variable):
```
NODE_VERSION = 18.19.0
NODE_ENV = production
VITE_SUPABASE_URL = https://hqlefdadfjdxxzzbtjqk.supabase.co
VITE_SUPABASE_ANON_KEY = <your-anon-key>
VITE_STRIPE_PUBLISHABLE_KEY = <your-publishable-key>
```

### Step 3: Deploy

1. Click **Save and Deploy**
2. Wait for initial build (2-3 minutes)
3. Note the preview URL: `honestinvoice.pages.dev`

---

## Part 2: Custom Domain Configuration

### Step 1: Add Custom Domain

1. In Cloudflare Pages project, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter: `honestinvoice.com`
4. Click **Continue**

### Step 2: Configure DNS Records

Cloudflare will automatically create DNS records if domain is on Cloudflare:

**Automatic Configuration** (domain on Cloudflare):
- CNAME record: `honestinvoice.com` -> `honestinvoice.pages.dev`
- CNAME record: `www.honestinvoice.com` -> `honestinvoice.pages.dev`

**Manual Configuration** (domain on external DNS):

Add these records to your DNS provider:

```
Type: CNAME
Name: @
Content: honestinvoice.pages.dev
TTL: Auto
Proxy status: Proxied (if on Cloudflare)

Type: CNAME
Name: www
Content: honestinvoice.pages.dev
TTL: Auto
Proxy status: Proxied (if on Cloudflare)
```

### Step 3: SSL/TLS Configuration

1. Go to **SSL/TLS** in Cloudflare Dashboard
2. Set encryption mode: **Full (strict)**
3. Enable **Always Use HTTPS**
4. Enable **Automatic HTTPS Rewrites**
5. Wait for SSL certificate to provision (5-10 minutes)

### Step 4: Configure Redirects

In **Rules** > **Page Rules**, add:

**Rule 1: WWW to non-WWW redirect**
```
URL pattern: www.honestinvoice.com/*
Setting: Forwarding URL (301 - Permanent Redirect)
Destination: https://honestinvoice.com/$1
```

**Rule 2: Force HTTPS**
```
URL pattern: http://honestinvoice.com/*
Setting: Always Use HTTPS
```

---

## Part 3: Security Headers Configuration

### Step 1: Create _headers File

Already configured in `cloudflare-pages.json`. Verify it includes:

```json
{
  "headers": [
    {
      "source": "/**",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

### Step 2: Content Security Policy (Optional)

For enhanced security, add CSP header:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; connect-src 'self' https://*.supabase.co https://api.stripe.com; frame-src https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:
```

---

## Part 4: Performance Optimization

### Step 1: Enable Cloudflare Performance Features

1. **Auto Minify**: Enable HTML, CSS, JavaScript
2. **Brotli Compression**: Enable
3. **HTTP/3 (QUIC)**: Enable
4. **0-RTT Connection Resumption**: Enable

### Step 2: Configure Cache Rules

In **Caching** > **Configuration**:

**Browser Cache TTL**: Respect Existing Headers

**Cache Rules** (already in cloudflare-pages.json):
```
/assets/** -> Cache for 1 year (immutable)
/*.js, /*.css -> Cache for 1 year (immutable)
/index.html -> No cache (must-revalidate)
```

---

## Part 5: CI/CD with GitHub Actions

### Step 1: Create GitHub Secrets

Navigate to GitHub Repository > Settings > Secrets and variables > Actions

Add these secrets:
```
CLOUDFLARE_API_TOKEN = <your-api-token>
CLOUDFLARE_ACCOUNT_ID = <your-account-id>
VITE_SUPABASE_URL = https://hqlefdadfjdxxzzbtjqk.supabase.co
VITE_SUPABASE_ANON_KEY = <your-anon-key>
VITE_STRIPE_PUBLISHABLE_KEY = <your-publishable-key>
```

### Step 2: Get Cloudflare API Token

1. Go to Cloudflare Dashboard > My Profile > API Tokens
2. Click **Create Token**
3. Use template: **Edit Cloudflare Workers**
4. Permissions:
   - Account > Cloudflare Pages > Edit
   - Zone > Zone > Read
5. Copy token and add to GitHub Secrets

### Step 3: Verify Workflow

The workflow file is already created at `.github/workflows/deploy.yml`

**Trigger**: Automatic deployment on push to main branch

**Verification**:
1. Push code to main branch
2. Go to GitHub > Actions tab
3. Watch deployment progress
4. Verify deployment at honestinvoice.com

---

## Part 6: Monitoring and Maintenance

### Step 1: Set Up Analytics

1. In Cloudflare Pages, enable **Web Analytics**
2. Add analytics script to site (optional, already tracked by Cloudflare)

### Step 2: Configure Alerts

1. Go to **Notifications** in Cloudflare
2. Create alerts for:
   - Deployment failures
   - High error rates
   - SSL certificate expiration

### Step 3: Monitor Edge Function Logs

Supabase Edge Functions:
1. Go to Supabase Dashboard > Edge Functions
2. Click on each function to view logs
3. Monitor for errors and performance issues

### Step 4: Database Performance

1. Supabase Dashboard > Database > Query Performance
2. Monitor slow queries
3. Add indexes as needed
4. Review RLS policy performance

---

## Part 7: Backup and Disaster Recovery

### Database Backups

Supabase provides automatic daily backups:
1. Navigate to Supabase Dashboard > Database > Backups
2. Download manual backup before major changes
3. Test restoration process quarterly

### Code Repository Backups

1. GitHub automatically backs up repositories
2. Create release tags for major deployments
3. Maintain changelog for version tracking

---

## Part 8: Production Deployment Checklist

Before going live, verify:

### Technical Checks
- [ ] All environment variables configured in Cloudflare Pages
- [ ] Custom domain DNS records propagated
- [ ] SSL certificate active and valid
- [ ] HTTPS enforced (redirect from HTTP)
- [ ] WWW redirect configured (www -> non-www)
- [ ] Security headers active
- [ ] Performance features enabled
- [ ] CI/CD pipeline tested and working

### Application Checks
- [ ] User registration works
- [ ] Login/logout functional
- [ ] Invoice creation successful
- [ ] Stripe payments processing (test mode → live mode)
- [ ] Public invoice verification working
- [ ] Transparency scores calculating
- [ ] Email notifications sent (if configured)
- [ ] All pages load correctly
- [ ] Mobile responsive
- [ ] Performance acceptable (Lighthouse score > 90)

### Security Checks
- [ ] RLS policies active on all tables
- [ ] Stripe webhook signatures verified (if configured)
- [ ] No sensitive data in client-side code
- [ ] API keys not exposed in browser
- [ ] CORS configured correctly
- [ ] Rate limiting enabled (Cloudflare)

### Monitoring Checks
- [ ] Analytics tracking configured
- [ ] Error alerts set up
- [ ] Performance monitoring active
- [ ] Database query logging enabled
- [ ] Edge function logs accessible

---

## Part 9: Post-Deployment Tasks

### Day 1
1. Monitor deployment logs for errors
2. Test all critical user paths
3. Verify Stripe webhooks (if configured)
4. Check database connections

### Week 1
1. Review analytics data
2. Monitor error rates
3. Check performance metrics
4. Gather user feedback

### Month 1
1. Review scaling needs
2. Optimize slow database queries
3. Update dependencies
4. Plan feature iterations

---

## Part 10: Troubleshooting

### Issue: Build Fails

**Check**:
1. Node version matches (18.19.0)
2. All dependencies in package.json
3. Build command correct
4. Environment variables set

**Solution**:
```bash
# Local test
npm install
npm run build

# Check logs in Cloudflare Pages > Deployments > View build log
```

### Issue: Domain Not Resolving

**Check**:
1. DNS propagation (use dnschecker.org)
2. CNAME records correct
3. SSL certificate provisioned

**Solution**:
```bash
# Check DNS
dig honestinvoice.com
nslookup honestinvoice.com

# Wait 24-48 hours for full DNS propagation
```

### Issue: 404 Errors on Routes

**Cause**: SPA routing not configured

**Solution**: Already handled in cloudflare-pages.json with:
```json
"routes": [{ "source": "/*", "destination": "/index.html" }]
```

### Issue: Stripe Payments Failing

**Check**:
1. VITE_STRIPE_PUBLISHABLE_KEY correct
2. Stripe secret key in Supabase Edge Functions
3. Network tab for API errors
4. Stripe Dashboard logs

**Solution**: Verify keys match environment (test vs live)

### Issue: Supabase Connection Errors

**Check**:
1. VITE_SUPABASE_URL correct
2. VITE_SUPABASE_ANON_KEY correct
3. RLS policies not blocking access
4. Network connectivity

**Solution**: Check Supabase Dashboard > API > Connection info

---

## Part 11: Scaling Considerations

### Application Scaling

Cloudflare Pages automatically scales to handle traffic.

**No action required** for:
- Traffic spikes
- Global distribution
- DDoS protection

### Database Scaling

Supabase Free Tier Limits:
- 500 MB database size
- 50,000 monthly active users
- 2 GB bandwidth

**Upgrade triggers**:
- Database size > 400 MB
- MAU > 40,000
- Bandwidth > 1.5 GB

**Upgrade to**: Supabase Pro ($25/month)

### Edge Function Scaling

Limits:
- 100,000 invocations/day (free)
- 500 ms max execution time

**Monitor**: Supabase Dashboard > Edge Functions > Usage

---

## Production URLs

**Live Application**: https://honestinvoice.com
**Preview (Cloudflare)**: https://honestinvoice.pages.dev
**Current Development**: https://x9jrrv8siwfm.space.minimax.io

**Supabase Dashboard**: https://supabase.com/dashboard/project/hqlefdadfjdxxzzbtjqk
**Stripe Dashboard**: https://dashboard.stripe.com

---

## Support Contacts

**Cloudflare Support**: https://dash.cloudflare.com/support
**Supabase Support**: https://supabase.com/dashboard/support
**Stripe Support**: https://support.stripe.com

---

## Quick Deployment Commands

```bash
# Clone repository
git clone <repository-url>
cd honestinvoice

# Install dependencies
npm install

# Build for production
npm run build

# Test production build locally
npm run preview

# Deploy to Cloudflare (via Git push)
git push origin main

# Manual deployment with Wrangler
npx wrangler pages deploy dist --project-name=honestinvoice
```

---

Last Updated: 2025-11-02
Version: 2.0.0 (Optimized)
Status: Production Ready
