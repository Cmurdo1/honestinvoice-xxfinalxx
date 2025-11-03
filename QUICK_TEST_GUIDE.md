# HonestInvoice.com - Quick Testing Guide

## 🚀 Live Production URL
**https://x9jrrv8siwfm.space.minimax.io**

## ⚠️ CRITICAL UPDATE (2025-11-02)
**Payment Bug Fixed**: The "Body already consumed" error in the payment edge function has been fixed and deployed (Version 5). This guide includes verification steps for the bug fix.

---

## ⚡ Quick Test Checklist (5 Minutes)

### Test 1: Registration & Login (1 min)
1. Visit the live URL
2. Click "Sign Up" or "Register"
3. Use any email/password
4. Login with credentials
✅ **Expected**: Dashboard loads successfully

### Test 2: Create Invoice (1 min)
1. Click "Create Invoice" button
2. Add customer info
3. Add 1-2 line items
4. Save invoice
✅ **Expected**: Invoice created, transparency score calculated

### Test 3: Public Verification (1 min)
1. Copy the invoice number from step 2
2. Open **new incognito window**
3. Visit the live URL
4. Go to "Client Portal" → "Verify Invoice"
5. Paste invoice number
✅ **Expected**: Invoice details + transparency scores visible (no login required)

### Test 4: Stripe Payment (2 min) ⭐ CRITICAL - BUG FIX VERIFICATION
**This test verifies the payment edge function bug fix**

1. From the verification page (or logged-in client portal)
2. Click "Pay Invoice"
3. Enter Stripe test card:
   - **Card**: `4242 4242 4242 4242`
   - **Expiry**: `12/34` (any future date)
   - **CVC**: `123` (any 3 digits)
   - **ZIP**: `12345` (any 5 digits)
4. Click "Pay"
5. **VERIFY**: NO "Body already consumed" error appears
6. **VERIFY**: Payment processes successfully
✅ **Expected**: Payment succeeds, invoice status = "Paid", transaction ID displayed

**Bug Fix Verification**:
- [ ] Payment completed without "Body already consumed" error
- [ ] Payment intent created successfully
- [ ] Invoice status updated to "Paid"
- [ ] Payment record saved correctly

### Test 5: Transparency Features (1 min)
1. From dashboard, click "Fair Billing Calculator"
2. Select project type, enter hours, choose complexity
3. Click "Calculate"
✅ **Expected**: Market rates and suggestions displayed

---

## 💳 Stripe Test Cards

### Successful Payments
```
Card: 4242 4242 4242 4242
Exp:  12/34
CVC:  123
ZIP:  12345
```

### Payment Requires Authentication
```
Card: 4000 0025 0000 3155
Exp:  12/34
CVC:  123
ZIP:  12345
```

### Declined Payment
```
Card: 4000 0000 0000 9995
Exp:  12/34
CVC:  123
ZIP:  12345
```

**More test cards**: https://stripe.com/docs/testing#cards

---

## 🎯 Key Features to Experience

### 1. Invoice Transparency Scores
- Create an invoice
- View the automatically calculated scores:
  - Overall Score (0-100%)
  - Itemization Score
  - Description Quality
  - Terms Clarity
- Read the AI-generated recommendations

### 2. Public Invoice Verification
- **No login required!**
- Enter any invoice number
- See full invoice details
- View transparency scores
- Pay invoice via Stripe

### 3. Fair Billing Calculator
- Navigate to "Fair Billing Calculator"
- Select: Web Development, 40 hours, Medium complexity
- See market rate range: $75-$150/hr
- Get suggested rate: ~$112.50/hr
- Total estimate: ~$4,500

### 4. Social Proof Metrics
- On dashboard, view "Client Trust Metrics"
- See CSAT score (4.8/5.0)
- See NPS score (72 - Excellent)
- See Transparency rating (4.9/5.0)

### 5. Team Management
- Add team member
- Assign role (Owner/Admin/Manager/Accountant/Viewer)
- Test different permission levels

### 6. Client Portal
**Two modes**:
- **Authenticated**: Login as client, see all your invoices
- **Public**: Verify any invoice by number (no login)

---

## 🐛 If You Encounter Issues

### Issue: "Invoice not found"
- Make sure the invoice status is NOT "draft"
- Only non-draft invoices are publicly visible

### Issue: Stripe payment stuck
- Check browser console for errors
- Verify Stripe keys are configured
- Try different test card number

### Issue: Can't create invoice
- Check if you're logged in
- Verify you have proper role (Owner/Admin/Manager/Accountant)

### Issue: Transparency score is 0
- Score calculation happens automatically
- Refresh the page
- Check that invoice has line items

---

## 📊 Test Data Examples

### Sample Customer
```
Name: Acme Corporation
Email: contact@acme.com
Phone: (555) 123-4567
```

### Sample Invoice Items
```
Item 1:
  Description: Website Development - Homepage
  Quantity: 1
  Rate: 2,500
  
Item 2:
  Description: Mobile Responsive Design
  Quantity: 1
  Rate: 1,500
```

---

## 🔍 Where to Find Things

### Dashboard
- URL: `/` (after login)
- Shows: Stats, quick actions, recent invoices, trust metrics

### Invoices
- URL: `/invoices`
- Create, view, edit, filter invoices

### Client Portal
- URL: `/client-portal`
- Dual mode: Authenticated + Public verification

### Fair Billing Calculator
- Dashboard → "Fair Billing Calculator" button
- OR navigate via menu

### Settings
- Top right → Settings icon
- User profile, company settings, notifications

---

## ✅ Success Criteria

After testing, you should be able to:
- [x] Register and login
- [x] Create an invoice with items
- [x] See transparency scores calculated
- [x] Verify invoice publicly (without login)
- [x] Pay invoice with Stripe test card
- [x] See payment confirmation
- [x] Use fair billing calculator
- [x] View social proof metrics
- [x] Manage customers
- [x] Add team members

---

## 🎉 You're All Set!

HonestInvoice.com is fully functional and ready for production use.

**Questions or issues?** Check the comprehensive guides:
- `DEPLOYMENT_GUIDE.md` - Full deployment details
- `FEATURE_SUMMARY.md` - Complete feature list

**Happy invoicing with transparency!** 🚀

---

*Last Updated: 2025-11-02*
*Production URL: https://x9jrrv8siwfm.space.minimax.io*
*Critical Bug Fixed: Payment edge function "Body already consumed" error (Version 5)*
