# HonestInvoice.com - Comprehensive Manual Testing Guide

**Critical**: Complete these tests before production deployment to honestinvoice.com

**Production URL**: https://x9jrrv8siwfm.space.minimax.io
**Test Date**: 2025-11-02
**Tester**: [Your Name]

---

## Critical Bug Fixed (2025-11-02)

**FIXED**: Payment edge function "Body already consumed" error
- **Issue**: Request body was parsed multiple times
- **Status**: Fixed and deployed (Version 5)
- **Verification Required**: Test complete payment flow end-to-end

---

## Test Environment Setup

### Required Test Data
1. **Email Account**: Use a real email you can access for verification
2. **Stripe Test Card**: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)
3. **Browser**: Use Chrome, Firefox, or Safari (latest version)
4. **Viewport**: Test on Desktop (1920x1080) and Mobile (iPhone/Android)

---

## Test Pathways

### PATHWAY 1: User Registration & Authentication (15 minutes)

**Objective**: Verify complete authentication flow

#### Steps:
1. **Access Application**
   - [ ] Navigate to https://x9jrrv8siwfm.space.minimax.io
   - [ ] Verify homepage loads with HonestInvoice branding
   - [ ] Check for professional UI with blue (#2563EB) color scheme
   - [ ] Verify "Get Started" or "Sign Up" button is visible

2. **Registration**
   - [ ] Click "Sign Up" or "Get Started"
   - [ ] Fill registration form:
     - Email: [your-email@example.com]
     - Password: TestUser2025!
     - Confirm Password: TestUser2025!
   - [ ] Submit registration
   - [ ] Verify toast notification appears (NOT browser alert)
   - [ ] Check email for verification link (Supabase confirmation)

3. **Email Verification**
   - [ ] Open email from Supabase
   - [ ] Click verification link
   - [ ] Verify redirect to application
   - [ ] Verify auto-login or prompted to login

4. **Login**
   - [ ] If not auto-logged in, use login form
   - [ ] Enter registered email and password
   - [ ] Click "Sign In"
   - [ ] Verify toast notification (NOT alert)
   - [ ] Verify redirect to Dashboard

5. **Dashboard Verification**
   - [ ] Check navigation menu appears:
     - Dashboard
     - Invoices
     - Create Invoice
     - Customers
     - Analytics
     - Team
     - Reports
     - Settings
   - [ ] Verify stats cards display (even if 0):
     - Total Invoices
     - Total Customers
     - Total Revenue
     - Pending Invoices
   - [ ] Verify professional styling and layout

6. **Logout**
   - [ ] Find and click logout button
   - [ ] Verify redirect to homepage/login
   - [ ] Verify toast notification

7. **Re-login**
   - [ ] Login again with same credentials
   - [ ] Verify successful authentication
   - [ ] Verify data persists

**Expected Results**:
- All toast notifications (no browser alerts)
- Smooth transitions between pages
- Professional UI throughout
- Data persistence after logout/login

**Issues Found**:
```
[Record any issues here]
```

---

### PATHWAY 2: Invoice Creation (10 minutes)

**Objective**: Create and verify invoice

#### Steps:
1. **Navigate to Create Invoice**
   - [ ] From Dashboard, click "Create Invoice" or "Invoices" > "New Invoice"
   - [ ] Verify form loads with all required fields

2. **Fill Invoice Details**
   - [ ] Invoice Number: [Auto-generated or enter: INV-TEST-001]
   - [ ] Customer Selection/Creation:
     - If creating new customer:
       - Name: "Test Client LLC"
       - Email: "client@testcompany.com"
       - Contact: "+1-555-0123"
     - If selecting existing customer, choose from dropdown
   - [ ] Project (optional): "Website Development"
   - [ ] Invoice Date: [Current date]
   - [ ] Due Date: [30 days from now]
   - [ ] Currency: USD

3. **Add Line Items**
   - [ ] Click "Add Item" or "Add Line Item"
   - [ ] Item 1:
     - Description: "Website Design & Development"
     - Quantity: 40
     - Rate: 150.00
     - Tax Rate: 0%
     - Verify amount calculates: 6,000.00
   - [ ] Add Item 2:
     - Description: "Hosting Setup & Configuration"
     - Quantity: 8
     - Rate: 100.00
     - Tax Rate: 0%
     - Verify amount calculates: 800.00
   - [ ] Verify Grand Total: 6,800.00

4. **Additional Options**
   - [ ] Notes: "Payment due within 30 days. Thank you for your business."
   - [ ] Terms: "Net 30"
   - [ ] Status: Draft or Sent

5. **Submit Invoice**
   - [ ] Click "Create Invoice" or "Save"
   - [ ] Verify toast notification: "Invoice created successfully!"
   - [ ] Verify redirect to Invoice List or Invoice Detail
   - [ ] **IMPORTANT**: Note the invoice number/ID for payment testing

6. **Verify Invoice in List**
   - [ ] Navigate to "Invoices" list
   - [ ] Find the newly created invoice
   - [ ] Verify all details are correct:
     - Customer name
     - Amount: $6,800.00
     - Status: Draft/Sent
     - Due date
   - [ ] Click to view invoice details
   - [ ] Verify transparency score appears (if feature enabled)

**Expected Results**:
- Calculations are accurate
- Toast notifications (no alerts)
- Invoice appears in list immediately
- All data saved correctly

**Invoice Created**:
```
Invoice Number: __________________
Invoice ID: __________________
Amount: $6,800.00
Customer: Test Client LLC
```

**Issues Found**:
```
[Record any issues here]
```

---

### PATHWAY 3: **STRIPE PAYMENT PROCESSING** (20 minutes) ⭐ CRITICAL ⭐

**Objective**: Verify complete payment lifecycle with Stripe integration

**CRITICAL BUG FIX VERIFICATION**:
This test verifies the fix for the "Body already consumed" error in the payment edge function.

#### Steps:

1. **Access Public Invoice Verification** (Client Perspective)
   - [ ] Open incognito/private browsing window (simulate client)
   - [ ] Navigate to https://x9jrrv8siwfm.space.minimax.io
   - [ ] Look for "Verify Invoice" or "Client Portal" link
   - [ ] Click to access public verification page

2. **Verify Invoice**
   - [ ] Enter the invoice number from Pathway 2: [__________]
   - [ ] Enter customer email: client@testcompany.com
   - [ ] Click "Verify" or "Access Invoice"
   - [ ] Verify invoice details display:
     - Invoice number
     - Customer name
     - Line items
     - Total amount: $6,800.00
     - Transparency score (should show scores for itemization, descriptions, etc.)

3. **Transparency Score Verification**
   - [ ] Verify transparency score displays with categories:
     - Overall Score: [%]
     - Itemization Transparency: [%]
     - Description Clarity: [%]
     - Terms Transparency: [%]
   - [ ] Scores should be visible and calculated

4. **Initiate Payment**
   - [ ] Verify "Pay Invoice" or "Make Payment" button is visible
   - [ ] Click the payment button
   - [ ] Verify Stripe payment form loads
   - [ ] Check for Stripe Elements (card input fields)

5. **Enter Payment Details** (Stripe Test Mode)
   - [ ] Card Number: 4242 4242 4242 4242
   - [ ] Expiry: 12/26 (any future date)
   - [ ] CVC: 123 (any 3 digits)
   - [ ] ZIP: 12345 (any 5 digits)
   - [ ] Name on Card: Test User
   - [ ] Verify card number is properly formatted (spaces added automatically)
   - [ ] Verify Stripe validation messages appear for invalid input

6. **Submit Payment**
   - [ ] Click "Pay Now" or "Submit Payment"
   - [ ] Watch for loading indicator
   - [ ] **CRITICAL**: Verify NO "Body already consumed" error appears
   - [ ] Verify payment processes successfully

7. **Payment Confirmation**
   - [ ] Verify success toast notification appears
   - [ ] Verify success message displays:
     - "Payment Successful" or similar
     - Payment amount: $6,800.00
     - Transaction ID displayed
   - [ ] Verify invoice status updates to "Paid"
   - [ ] Verify payment confirmation details:
     - Payment method: Card (last 4 digits)
     - Date/time of payment
     - Transaction reference

8. **Verify Payment in Dashboard** (Business Perspective)
   - [ ] Return to main browser window (logged in as business)
   - [ ] Navigate to Invoices list
   - [ ] Find the test invoice
   - [ ] Verify status changed to "Paid"
   - [ ] Verify balance due is $0.00
   - [ ] Click invoice to view details
   - [ ] Verify payment record appears:
     - Amount: $6,800.00
     - Gateway: Stripe
     - Transaction ID
     - Date/time
     - Status: Succeeded

9. **Verify Payment in Payments Table**
   - [ ] Navigate to "Reports" or "Payments" section
   - [ ] Find the payment record
   - [ ] Verify all payment details are correct
   - [ ] Verify it's linked to correct invoice

10. **Test Partial Payment** (Optional)
    - [ ] Create another invoice for $1,000.00
    - [ ] Use public portal to pay $500.00
    - [ ] Verify status changes to "Partial Paid"
    - [ ] Verify balance due updates to $500.00
    - [ ] Pay remaining $500.00
    - [ ] Verify final status is "Paid"

**Expected Results**:
- Payment processes without "Body already consumed" error
- Stripe Elements load correctly
- Payment confirmation immediate
- Invoice status updates automatically
- Payment records created correctly
- Transparency scores display properly
- All amounts calculate correctly
- Toast notifications (no alerts)

**CRITICAL VERIFICATION**:
- [ ] Payment completes successfully (proves bug fix works)
- [ ] No "Body already consumed" error
- [ ] Edge function returns proper response

**Payment Details**:
```
Invoice Number: __________________
Payment Amount: $6,800.00
Transaction ID: __________________
Status: __________________
Any Errors: __________________
```

**Issues Found**:
```
[Record any issues here - especially any errors with payment processing]
```

---

### PATHWAY 4: Customer Management (10 minutes)

**Objective**: Verify customer CRUD operations

#### Steps:
1. **Navigate to Customers**
   - [ ] Click "Customers" in navigation
   - [ ] Verify customer list loads
   - [ ] Verify "Test Client LLC" appears (from invoice creation)

2. **Create New Customer**
   - [ ] Click "Add Customer" or "New Customer"
   - [ ] Fill form:
     - Name: "Another Test Company"
     - Email: "another@testcompany.com"
     - Phone: "+1-555-0199"
     - Address: "123 Test Street, Test City, TS 12345"
   - [ ] Click "Save"
   - [ ] Verify toast notification
   - [ ] Verify customer appears in list

3. **Edit Customer**
   - [ ] Click "Edit" on "Test Client LLC"
   - [ ] Update phone: "+1-555-9999"
   - [ ] Click "Save"
   - [ ] Verify toast notification
   - [ ] Verify change persists

4. **View Customer Details**
   - [ ] Click on customer name
   - [ ] Verify details display
   - [ ] Verify associated invoices appear (should show test invoice)

5. **Search/Filter Customers**
   - [ ] Use search box to find "Test Client"
   - [ ] Verify filtering works
   - [ ] Clear search
   - [ ] Verify full list returns

**Expected Results**:
- All CRUD operations work
- Data persists correctly
- Toast notifications appear
- Customer-invoice relationships maintained

**Issues Found**:
```
[Record any issues here]
```

---

### PATHWAY 5: Team Management (10 minutes)

**Objective**: Verify role-based team features

#### Steps:
1. **Navigate to Team**
   - [ ] Click "Team" in navigation
   - [ ] Verify team member list loads
   - [ ] Verify your account appears as Owner/Admin

2. **Invite Team Member**
   - [ ] Click "Invite Member" or "Add Team Member"
   - [ ] Fill form:
     - Email: "teammate@testcompany.com"
     - Role: Editor or Viewer
   - [ ] Click "Send Invitation"
   - [ ] Verify toast notification
   - [ ] Verify pending invitation appears

3. **View Team Member Details**
   - [ ] Click on team member
   - [ ] Verify role is displayed
   - [ ] Verify permissions information shown

4. **Update Team Member Role** (if supported)
   - [ ] Change role from Viewer to Editor (or vice versa)
   - [ ] Verify toast notification
   - [ ] Verify change persists

**Expected Results**:
- Invitations sent successfully
- Roles assigned correctly
- Toast notifications appear
- Team list updates

**Issues Found**:
```
[Record any issues here]
```

---

### PATHWAY 6: Unique Features Verification (15 minutes)

**Objective**: Test HonestInvoice differentiating features

#### A. Fair Billing Calculator
1. **Access Calculator**
   - [ ] Navigate to Dashboard
   - [ ] Find "Fair Billing Calculator" section or link
   - [ ] Click to access

2. **Use Calculator**
   - [ ] Enter project details:
     - Hours: 100
     - Hourly rate: $150
     - Expenses: $500
   - [ ] Click "Calculate"
   - [ ] Verify calculation displays: $15,500
   - [ ] Verify fee transparency shown
   - [ ] Verify recommendations appear (if applicable)

3. **Validation**
   - [ ] Try invalid inputs (negative numbers, letters)
   - [ ] Verify proper validation messages
   - [ ] Verify toast notifications (no alerts)

#### B. Social Proof / Trust Metrics
1. **Access Social Proof**
   - [ ] Navigate to Dashboard
   - [ ] Find "Trust Metrics" or "Social Proof" section
   - [ ] Verify displays:
     - Client satisfaction scores (CSAT/NPS)
     - Average transparency score
     - Payment success rate
     - On-time delivery rate

2. **Verify Data**
   - [ ] Check if metrics update based on test data
   - [ ] Verify visualizations are clear
   - [ ] Verify data is accurate

#### C. Transparency Scoring
1. **Review Scoring Logic**
   - [ ] Create invoice with minimal details (vague descriptions)
   - [ ] Check transparency score (should be lower)
   - [ ] Create invoice with detailed descriptions
   - [ ] Check transparency score (should be higher)
   - [ ] Verify scoring is logical and helpful

**Expected Results**:
- All unique features functional
- Calculations accurate
- Data displays correctly
- Professional UI for all features

**Issues Found**:
```
[Record any issues here]
```

---

### PATHWAY 7: Analytics & Reports (10 minutes)

**Objective**: Verify data visualization and reporting

#### Steps:
1. **Navigate to Analytics**
   - [ ] Click "Analytics" in navigation
   - [ ] Verify dashboard loads with charts

2. **Review Analytics**
   - [ ] Revenue charts display
   - [ ] Invoice status breakdown shows
   - [ ] Customer analytics visible
   - [ ] Date range filters work

3. **Navigate to Reports**
   - [ ] Click "Reports" in navigation
   - [ ] Verify report types available:
     - Financial Summary
     - Invoice Report
     - Customer Report
     - Payment Report

4. **Generate Report**
   - [ ] Select report type
   - [ ] Choose date range
   - [ ] Click "Generate"
   - [ ] Verify report displays correct data
   - [ ] Verify export options work (if available)

**Expected Results**:
- Charts render correctly
- Data is accurate
- Filters work properly
- Reports generate successfully

**Issues Found**:
```
[Record any issues here]
```

---

### PATHWAY 8: Settings Management (10 minutes)

**Objective**: Verify settings functionality

#### Steps:
1. **Navigate to Settings**
   - [ ] Click "Settings" in navigation
   - [ ] Verify settings page loads with tabs/sections

2. **User Profile Settings**
   - [ ] Update display name
   - [ ] Update email (if editable)
   - [ ] Update phone number
   - [ ] Click "Save"
   - [ ] Verify toast notification
   - [ ] Verify changes persist

3. **Company Settings**
   - [ ] Navigate to Company/Business section
   - [ ] Update company name
   - [ ] Update company address
   - [ ] Update company logo (if supported)
   - [ ] Click "Save"
   - [ ] Verify toast notification
   - [ ] Verify changes appear on invoices

4. **Notification Settings**
   - [ ] Toggle email notifications
   - [ ] Toggle payment notifications
   - [ ] Click "Save"
   - [ ] Verify toast notification
   - [ ] Verify settings persist

5. **Password Change**
   - [ ] Navigate to Security/Password section
   - [ ] Enter current password
   - [ ] Enter new password: NewTestPass2025!
   - [ ] Confirm new password
   - [ ] Click "Update Password"
   - [ ] Verify toast notification
   - [ ] Logout and login with new password
   - [ ] Verify new password works

**Expected Results**:
- All settings save correctly
- Toast notifications appear
- Changes persist after logout/login
- No browser alerts

**Issues Found**:
```
[Record any issues here]
```

---

### PATHWAY 9: Responsive Design Testing (15 minutes)

**Objective**: Verify mobile and tablet responsiveness

#### Desktop (1920x1080)
- [ ] All pages render correctly
- [ ] Navigation menu fully visible
- [ ] Tables display properly
- [ ] Forms are usable
- [ ] No horizontal scrolling

#### Tablet (768x1024 - iPad)
1. **Resize browser or use responsive mode**
   - [ ] Navigation adapts (hamburger menu if needed)
   - [ ] Dashboard cards stack properly
   - [ ] Invoice list readable
   - [ ] Forms remain usable
   - [ ] Payment form works

2. **Test Critical Features**
   - [ ] Create invoice on tablet
   - [ ] Make payment on tablet
   - [ ] Navigate all sections

#### Mobile (375x667 - iPhone SE)
1. **Resize to mobile viewport**
   - [ ] Navigation collapses to hamburger
   - [ ] All content readable without horizontal scroll
   - [ ] Buttons are touch-friendly (44px minimum)
   - [ ] Forms work with mobile keyboard
   - [ ] Tables adapt (scroll or stack)

2. **Test Critical Features**
   - [ ] Login/Register on mobile
   - [ ] View invoice on mobile
   - [ ] Make payment on mobile (Stripe Elements responsive)
   - [ ] Navigate all sections

**Expected Results**:
- Smooth responsive behavior
- No layout breaks
- Touch targets adequate size
- Text remains readable
- All features functional on all sizes

**Issues Found**:
```
[Record any issues here]
```

---

### PATHWAY 10: Error Handling & Edge Cases (10 minutes)

**Objective**: Verify proper error handling

#### Steps:
1. **Invalid Login**
   - [ ] Try login with wrong password
   - [ ] Verify error toast (not alert)
   - [ ] Verify helpful error message

2. **Duplicate Invoice**
   - [ ] Try creating invoice with duplicate number
   - [ ] Verify error toast
   - [ ] Verify validation message

3. **Invalid Payment**
   - [ ] Use Stripe test card: 4000 0000 0000 0002 (decline)
   - [ ] Verify error handled gracefully
   - [ ] Verify error toast appears
   - [ ] Verify invoice status doesn't change

4. **Network Error Simulation**
   - [ ] Open DevTools > Network
   - [ ] Throttle to "Slow 3G"
   - [ ] Try loading pages
   - [ ] Verify loading states appear
   - [ ] Verify eventual successful load

5. **Form Validation**
   - [ ] Submit empty invoice form
   - [ ] Verify validation messages
   - [ ] Verify toast notifications
   - [ ] Enter invalid email format
   - [ ] Verify email validation

**Expected Results**:
- All errors handled gracefully
- Toast notifications (no alerts)
- Helpful error messages
- No application crashes
- Loading states visible

**Issues Found**:
```
[Record any issues here]
```

---

## Performance Testing

### Lighthouse Audit
1. **Run Lighthouse** (Chrome DevTools)
   - [ ] Open DevTools > Lighthouse
   - [ ] Select: Performance, Accessibility, Best Practices, SEO
   - [ ] Run audit on homepage
   - [ ] Run audit on Dashboard

2. **Verify Scores**
   - [ ] Performance: > 90
   - [ ] Accessibility: > 90
   - [ ] Best Practices: > 90
   - [ ] SEO: > 90

3. **Check Metrics**
   - [ ] First Contentful Paint: < 1.5s
   - [ ] Time to Interactive: < 3.0s
   - [ ] Speed Index: < 3.0s
   - [ ] Total Blocking Time: < 200ms
   - [ ] Largest Contentful Paint: < 2.5s
   - [ ] Cumulative Layout Shift: < 0.1

**Results**:
```
Performance: ____
Accessibility: ____
Best Practices: ____
SEO: ____
```

---

## Security Testing

### Basic Security Checks
1. **HTTPS Enforcement**
   - [ ] Verify site uses HTTPS
   - [ ] Try accessing via HTTP
   - [ ] Verify redirect to HTTPS

2. **Authentication Protection**
   - [ ] Try accessing Dashboard without login
   - [ ] Verify redirect to login page
   - [ ] Verify protected routes are secured

3. **Cross-Site Scripting (XSS) Protection**
   - [ ] Try entering `<script>alert('XSS')</script>` in invoice notes
   - [ ] Verify script doesn't execute
   - [ ] Verify content is sanitized

4. **SQL Injection Protection**
   - [ ] Try entering `' OR '1'='1` in search fields
   - [ ] Verify no database errors
   - [ ] Verify proper escaping

5. **Session Management**
   - [ ] Login
   - [ ] Close browser
   - [ ] Reopen browser
   - [ ] Verify session persists (or prompts re-login as expected)

**Results**:
```
All security checks: PASS / FAIL
Details: _______________
```

---

## Console Error Check

### Browser Console Review
1. **Check Console** (Every Page)
   - [ ] Open DevTools > Console
   - [ ] Navigate through all pages
   - [ ] Record any errors or warnings

**Errors Found**:
```
Page: ______________
Error: ______________

Page: ______________
Error: ______________
```

**Acceptable Warnings**:
- Third-party library warnings (React DevTools, etc.)
- Development-only warnings (if in dev mode)

**Unacceptable Errors**:
- JavaScript errors
- Network errors (404, 500)
- React errors
- Type errors

---

## Final Checklist

### Critical Features (Must Pass)
- [ ] User can register and login
- [ ] User can create invoices
- [ ] **User can make Stripe payments successfully** ⭐
- [ ] Payments update invoice status correctly
- [ ] Public invoice verification works
- [ ] Transparency scores display
- [ ] All toast notifications (no browser alerts)
- [ ] Mobile responsive design works

### Important Features (Should Pass)
- [ ] Customer management works
- [ ] Team management works
- [ ] Fair billing calculator functions
- [ ] Social proof metrics display
- [ ] Analytics and reports generate
- [ ] Settings save correctly
- [ ] Error handling is graceful

### Quality Checks (Should Pass)
- [ ] Lighthouse score > 90
- [ ] No critical console errors
- [ ] Professional UI throughout
- [ ] Data persists correctly
- [ ] Loading states visible
- [ ] Forms validate properly

---

## Test Summary

**Tester Name**: ___________________  
**Test Date**: 2025-11-02  
**Test Duration**: _____ hours  

### Overall Status
- [ ] PASS - Ready for production
- [ ] FAIL - Issues must be fixed before production
- [ ] PARTIAL - Minor issues, can deploy with notes

### Critical Issues Found
```
1. __________________________________
2. __________________________________
3. __________________________________
```

### Minor Issues Found
```
1. __________________________________
2. __________________________________
3. __________________________________
```

### Recommendations
```
__________________________________
__________________________________
__________________________________
```

### Sign-off
**Tested By**: ___________________  
**Signature**: ___________________  
**Date**: 2025-11-02  

---

## Next Steps After Testing

### If All Tests Pass
1. Update PRODUCTION_CHECKLIST.md with test results
2. Proceed with Cloudflare Pages deployment
3. Configure custom domain (honestinvoice.com)
4. Set up monitoring and alerts
5. Announce launch

### If Issues Found
1. Document all issues in this guide
2. Prioritize: Critical > Important > Minor
3. Fix critical issues first
4. Re-test affected features
5. Re-run full test when all fixed

---

## Support Information

**Application**: HonestInvoice.com  
**Version**: 2.0.0 (Optimized)  
**Deployment**: https://x9jrrv8siwfm.space.minimax.io  
**Target Production**: https://honestinvoice.com  

**Critical Bug Fixed**: Payment edge function "Body already consumed" error (2025-11-02)

**For Issues**: Document in this guide with screenshots and detailed steps to reproduce.
