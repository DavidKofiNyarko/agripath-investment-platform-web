# Setup Guide

This guide covers environment configuration, database setup, and Supabase dashboard settings required to run AgriPath.

---

## 1. Environment variables

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL, e.g. `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes* | Publishable/anon key. *Any one of `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`, or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is sufficient — the app checks them in that order. |
| `NEXT_PUBLIC_API_BASE_URL` | No | Backend API base URL. Defaults to `https://infra.agripath.co`. |
| `NEXT_PUBLIC_PAYMENT_API_URL` | No | Payment API base URL. Defaults to `https://infra.agripath.co/api/payments`. |
| `NEXT_PUBLIC_SUPABASE_STORAGE_HOST` | No | Storage host for image optimization. Defaults to the host of `NEXT_PUBLIC_SUPABASE_URL`. |
| `SUPABASE_ACCESS_TOKEN` | No | Supabase access token used by the read-only MCP server in `.cursor/mcp.json`. |
| `SUPABASE_PROJECT_REF` | No | Supabase project reference used by `.cursor/mcp.json`. |

> **Note:** In the browser, the app detects localhost and automatically targets the development API (`dev.infra.agripath.co`). Deployed environments use the production endpoints unless overridden.

---

## 2. Database schema

Run these migrations in the Supabase SQL editor (or via Supabase CLI):

1. `supabase/migrations/20251122000000_complete_schema.sql` — core schema (users, projects, investments, wallets, transactions, payouts, notifications, approvals, and more)
2. `migrations/create_payment_accounts_table.sql` — payment accounts table with RLS policies

---

## 3. Supabase dashboard settings

Apply these settings in **Supabase Dashboard → Authentication → Settings**:

| Setting | Recommended value | Why |
| --- | --- | --- |
| Custom SMTP | Your provider (SendGrid, Mailgun, Resend, AWS SES) | Branded sender (`noreply@agripath.co`) and deliverability |
| Leaked password protection | Enabled | Blocks passwords found in data breaches |
| OTP expiry | 15–30 minutes | Limits OTP validity window |
| MFA (TOTP) | Enabled | Second factor for user accounts |

### Network restrictions

Under **Settings → Database → Network Restrictions**, enable access restriction and allowlist your office IP, server IPs, and current IP before saving — otherwise you may lock yourself out.

### OAuth providers

See [email-templates.md](email-templates.md) for Google, GitHub, and Apple OAuth setup, including the required callback URL:

```
https://<project-ref>.supabase.co/auth/v1/callback
```

### Custom API domain (optional)

To use `api.agripath.co` instead of the default Supabase URL:

1. **Supabase Dashboard → Settings → API → Custom Domain**
2. Add `api.agripath.co`
3. Create a CNAME record: `api` → `<project-ref>.supabase.co`
4. Wait for DNS propagation (up to 24 hours); SSL is auto-provisioned
5. Update `NEXT_PUBLIC_SUPABASE_URL` in your environment

---

## 4. Verify the setup

1. Run `npm run dev` and open http://localhost:3000
2. Sign up and confirm the email arrives with the branded template
3. Complete profile setup and KYC verification
4. Confirm project list loads and realtime updates work (see [realtime.md](realtime.md))

---

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Blank page / auth errors | Missing or mismatched Supabase variables | Verify URL and key in `.env.local`; restart the dev server |
| Emails not sending | SMTP misconfigured | Check credentials, verified domain, and port (587 TLS / 465 SSL); send a test email from the dashboard |
| OAuth redirect fails | Callback URL mismatch | Ensure the provider's callback URL matches the Supabase callback URL exactly |
| Locked out after network restrictions | IP not allowlisted | Add your current IP (check via whatismyipaddress.com) |
| Images from storage not loading | Storage host not allowed | Set `NEXT_PUBLIC_SUPABASE_STORAGE_HOST` to your project host |

## Resources

- [Supabase Auth documentation](https://supabase.com/docs/guides/auth)
- [Custom SMTP guide](https://supabase.com/docs/guides/auth/auth-smtp)
- [MFA setup](https://supabase.com/docs/guides/auth/auth-mfa)
- [Network restrictions](https://supabase.com/docs/guides/platform/network-restrictions)
- [Database upgrades](https://supabase.com/docs/guides/platform/upgrading)
