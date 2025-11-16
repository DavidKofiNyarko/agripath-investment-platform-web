# Manual Setup Guide for Supabase Pro Features

This guide covers all the features that need to be configured manually in the Supabase Dashboard. I've already automated everything possible via MCP.

---

## ✅ Already Automated via MCP

### Security Fixes

- ✅ Enabled RLS on 13 critical tables
- ✅ Added RLS policies for all tables that needed them
- ✅ Enabled realtime for key tables (projects, transactions, wallets, users_notifications, profile)

### What's Working Now

- Real-time subscriptions are fully configured
- RLS policies are in place for data security
- Database security is significantly improved

---

## 📋 Manual Setup Required

### 1. **Custom SMTP Configuration** (30 minutes) ⭐ HIGH PRIORITY

**Why:** Professional email addresses (noreply@agripath.co) and better deliverability

**Steps:**

1. **Choose an SMTP Provider:**

   - **SendGrid** (Recommended - Free tier: 100 emails/day)
   - **Mailgun** (Free tier: 5,000 emails/month)
   - **AWS SES** (Pay as you go)
   - **Resend** (Modern, developer-friendly)

2. **Sign up and Get Credentials:**

   - Create account
   - Verify your domain (agripath.co)
   - Get SMTP credentials:
     - SMTP Host
     - SMTP Port (usually 587 or 465)
     - SMTP Username
     - SMTP Password

3. **Configure in Supabase:**

   - Go to: **Supabase Dashboard** → **Settings** → **Auth** → **SMTP Settings**
   - Enable "Custom SMTP"
   - Enter your SMTP credentials:
     - **Host:** smtp.sendgrid.net (or your provider)
     - **Port:** 587
     - **Username:** Your SMTP username
     - **Password:** Your SMTP password
     - **Sender email:** noreply@agripath.co
     - **Sender name:** AgriPath
   - Click **Save**

4. **Test:**
   - Send a test email
   - Verify it arrives from noreply@agripath.co
   - Check spam folder if needed

**Recommended Provider:** SendGrid (easiest setup, good free tier)

---

### 2. **Enable Leaked Password Protection** (2 minutes) ⭐ HIGH PRIORITY

**Why:** Prevents users from using compromised passwords

**Steps:**

1. Go to: **Supabase Dashboard** → **Authentication** → **Settings**
2. Scroll to **Password Security**
3. Enable **"Leaked Password Protection"**
4. Click **Save**

**Impact:** Users won't be able to use passwords found in data breaches

---

### 3. **Reduce OTP Expiry Time** (2 minutes) ⭐ HIGH PRIORITY

**Why:** Better security - OTPs should expire quickly

**Steps:**

1. Go to: **Supabase Dashboard** → **Authentication** → **Settings**
2. Scroll to **OTP Settings**
3. Change **OTP Expiry** from current value to **15 minutes** (or 30 minutes max)
4. Click **Save**

**Current Issue:** OTP expiry is > 1 hour (security risk)
**Recommended:** 15-30 minutes

---

### 4. **Upgrade Postgres Version** (10 minutes) ⚠️ MEDIUM PRIORITY

**Why:** Security patches and performance improvements

**Steps:**

1. Go to: **Supabase Dashboard** → **Database** → **Settings**
2. Check **Current Version:** supabase-postgres-17.4.1.064
3. Look for **"Upgrade Available"** notification
4. Click **"Upgrade Database"**
5. **Schedule during low-traffic period** (maintenance window)
6. Confirm upgrade

**Note:**

- May cause brief downtime (1-2 minutes)
- Schedule during off-peak hours
- Backup is automatic

---

### 5. **Network Restrictions** (15 minutes) 🔒 HIGH PRIORITY

**Why:** Restrict database access to known IPs only

**Steps:**

1. Go to: **Supabase Dashboard** → **Settings** → **Database**
2. Scroll to **Network Restrictions**
3. Enable **"Restrict Database Access"**
4. Add allowed IPs:
   - Your office IP
   - Your home IP (if you work from home)
   - Server IPs (if you have backend servers)
   - **Important:** Add your current IP first!
5. Click **Save**

**Warning:** If you don't add your IP, you'll be locked out!

**How to find your IP:**

- Visit: https://whatismyipaddress.com/
- Copy your IPv4 address
- Add it to the allowlist

---

### 6. **GitHub OAuth Setup** (20 minutes) 📱 MEDIUM PRIORITY

**Why:** More sign-in options for users

**Steps:**

1. **Create GitHub OAuth App:**

   - Go to: https://github.com/settings/developers
   - Click **"New OAuth App"**
   - **Application name:** `AgriPath`
   - **Homepage URL:** `https://agripath.co`
   - **Authorization callback URL:** `https://gbeqqboxlflpgehyqlld.supabase.co/auth/v1/callback`
   - Click **"Register application"**
   - Copy **Client ID**
   - Click **"Generate a new client secret"**
   - Copy **Client Secret** (save it - you won't see it again!)

2. **Configure in Supabase:**

   - Go to: **Supabase Dashboard** → **Authentication** → **Providers**
   - Find **GitHub** provider
   - Click **Enable**
   - Enter **Client ID** from GitHub
   - Enter **Client Secret** from GitHub
   - Click **Save**

3. **Test:**
   - Go to your signin page
   - Click "Continue with GitHub"
   - Verify redirect works
   - Check user is created in Supabase

---

### 7. **Enable MFA/2FA** (15 minutes) 🔐 HIGH PRIORITY

**Why:** Enhanced account security

**Steps:**

1. Go to: **Supabase Dashboard** → **Authentication** → **Providers**
2. Scroll to **Multi-Factor Authentication**
3. Enable **"Enable MFA"**
4. Choose method:
   - **TOTP** (Time-based One-Time Password) - Recommended
   - **SMS** (if you have Twilio configured)
5. Set **MFA Factor Name:** `AgriPath`
6. Click **Save**

**Note:** Users will need to enable MFA in their account settings after this is enabled.

---

### 8. **Custom Domain for API** (30 minutes) 🌐 MEDIUM PRIORITY

**Why:** Professional branding (api.agripath.co instead of gbeqqboxlflpgehyqlld.supabase.co)

**Steps:**

1. Go to: **Supabase Dashboard** → **Settings** → **API**
2. Scroll to **Custom Domain**
3. Click **"Add Custom Domain"**
4. Enter domain: `api.agripath.co`
5. Follow DNS configuration instructions:
   - Add CNAME record pointing to your Supabase project
   - Wait for DNS propagation (can take up to 24 hours)
6. SSL certificate will be auto-provisioned

**DNS Configuration:**

```
Type: CNAME
Name: api
Value: gbeqqboxlflpgehyqlld.supabase.co
TTL: 3600
```

**Note:** You'll need to update your frontend API URLs after this is configured.

---

### 9. **Review Security Definer Views** (30 minutes) ⚠️ LOW PRIORITY

**Why:** These views have elevated permissions and should be reviewed

**Views to Review:**

- `payout_calculations_v2`
- `high_ticket_investment_analytics_v2`
- `high_ticket_investment_analytics`
- `payout_calculations`
- `project_updates_summary_v2`
- `project_reports_summary_v2`

**Steps:**

1. Go to: **Supabase Dashboard** → **Database** → **Tables**
2. Click on each view
3. Review the SQL definition
4. Verify they're necessary
5. Consider alternatives if possible

**Action:** These are likely fine, but worth reviewing for security.

---

### 10. **Fix Function Search Path** (Future) ⚠️ LOW PRIORITY

**Why:** Security best practice (30+ functions affected)

**Note:** This is a low-priority warning. The functions work fine, but setting search_path explicitly is a security best practice.

**Action:** Can be done gradually as you update functions. Not urgent.

---

## 🎯 Priority Order

### Do These First (This Week):

1. ✅ **Custom SMTP** - Professional emails
2. ✅ **Leaked Password Protection** - Quick security win
3. ✅ **Reduce OTP Expiry** - Quick security fix
4. ✅ **Network Restrictions** - Important security
5. ✅ **Enable MFA** - Enhanced security

### Do These Soon (This Month):

6. ✅ **GitHub OAuth** - More sign-in options
7. ✅ **Upgrade Postgres** - Security patches
8. ✅ **Custom Domain** - Better branding

### Do These Later (Low Priority):

9. ✅ **Review Security Definer Views** - When you have time
10. ✅ **Fix Function Search Path** - Gradual improvement

---

## 📝 Quick Checklist

Copy this checklist and check off as you complete:

- [ ] Custom SMTP configured
- [ ] Leaked password protection enabled
- [ ] OTP expiry reduced to 15-30 minutes
- [ ] Network restrictions configured
- [ ] MFA/2FA enabled
- [ ] GitHub OAuth configured
- [ ] Postgres version upgraded
- [ ] Custom domain configured (optional)
- [ ] Security definer views reviewed (optional)

---

## 🆘 Troubleshooting

### Can't Access Database After Network Restrictions

- **Solution:** Add your current IP to the allowlist
- Find your IP: https://whatismyipaddress.com/
- Temporarily disable restrictions if needed

### Emails Not Sending After SMTP Setup

- **Check:** SMTP credentials are correct
- **Check:** Domain is verified with SMTP provider
- **Check:** Port is correct (587 for TLS, 465 for SSL)
- **Test:** Send test email from Supabase Dashboard

### GitHub OAuth Not Working

- **Check:** Callback URL matches exactly
- **Check:** Client ID and Secret are correct
- **Check:** GitHub app is not suspended
- **Test:** Try in incognito mode

---

## 📚 Resources

- [Supabase Auth Settings](https://supabase.com/docs/guides/auth)
- [Custom SMTP Guide](https://supabase.com/docs/guides/auth/auth-smtp)
- [MFA Setup](https://supabase.com/docs/guides/auth/auth-mfa)
- [Network Restrictions](https://supabase.com/docs/guides/platform/network-restrictions)
- [Database Upgrades](https://supabase.com/docs/guides/platform/upgrading)

---

## ✅ Summary

**Automated (Done):**

- RLS enabled and policies added
- Realtime enabled for key tables
- Security improvements applied

**Manual (You Need to Do):**

- Custom SMTP (30 min)
- Security settings (10 min)
- Network restrictions (15 min)
- GitHub OAuth (20 min)
- MFA setup (15 min)

**Total Time:** ~1.5 hours for all manual steps

Start with the high-priority items first!
