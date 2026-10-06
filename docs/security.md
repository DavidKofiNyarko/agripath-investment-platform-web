# Security

AgriPath handles financial data, so security is enforced at every layer: transport, authentication, database row-level security, and client-side secrets handling.

---

## Security model

### Secrets management

- **No secrets in the repository.** All credentials (Supabase keys, API URLs, MCP access tokens) are injected via environment variables. See `.env.example` for the full list.
- The only Supabase key shipped to the browser is the **publishable/anon key**, which is scoped by Row Level Security. Service-role keys are never used in this codebase.
- `.cursor/mcp.json` uses `${SUPABASE_ACCESS_TOKEN}` / `${SUPABASE_PROJECT_REF}` environment variable placeholders — the token itself is never committed.

### Authentication

- Supabase Auth with email/password, magic links, and OAuth (Google, GitHub, Apple)
- Email verification required before investing
- KYC verification gate before investment activity
- 4-digit transaction PIN, bcrypt-hashed (12 rounds) via `lib/pin-security.ts`; PINs are never stored or logged in plain text
- Password strength validation and Supabase leaked-password protection (HaveIBeenPwned)
- Granular sign-out scopes: current device, other devices, or all devices

### Database (Postgres / Supabase)

- **Row Level Security (RLS) enabled on all tables**, with per-user policies — users can only read/write their own profile, wallet, transactions, investments, payouts, payment accounts, and notifications
- Admin operations (`admins`, approval workflows, audit logs) are restricted to authorized roles
- Payout and wallet mutation functions are protected by approval workflows with audit logging (`wallet_audit_log`, `approval_audit_log`)

### Payments

- Card and mobile-money payments are processed by Paystack via the payment API (`infra.agripath.co`); card details never touch the AgriPath database
- Fee calculation, Luhn card validation, and Ghana mobile-number validation are handled in `lib/paymentService.ts`

---

## Hardening checklist

These items are configured in the **Supabase Dashboard** and should be verified before production:

- [ ] Custom SMTP configured (branded sender, improved deliverability)
- [ ] Leaked password protection enabled (Authentication → Settings → Password Security)
- [ ] OTP expiry set to 15–30 minutes (Authentication → Settings → OTP)
- [ ] Network restrictions / IP allowlist configured (Settings → Database)
- [ ] MFA (TOTP) enabled (Authentication → Providers → MFA)
- [ ] GitHub/Apple OAuth configured (see [email-templates.md](email-templates.md))
- [ ] Postgres version kept up to date (Database → Settings → Upgrade)
- [ ] Custom API domain configured (optional, Settings → API)

### Review items

- **Security definer views** — `payout_calculations*`, `high_ticket_investment_analytics*`, `project_updates_summary_v2`, `project_reports_summary_v2` use `SECURITY DEFINER`; verify they are still required and expose no excess data
- **Function search path** — 30+ functions have a mutable `search_path`; best practice is `SET search_path = public, pg_temp` (apply gradually as functions are updated)

---

## Verify RLS is active

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('admins', 'profile', 'wallets', 'transactions', 'investments', 'payouts');
```

All listed tables should report `rowsecurity = true`. Then test access controls:

1. Sign in as a regular user — you can only see your own wallet, transactions, and investments
2. Attempt direct API access to another user's data — it must be rejected
3. Confirm wallet mutations require the transaction PIN

## Incident response

If a credential is ever exposed (committed, logged, or shared):

1. **Rotate immediately** — Supabase: Dashboard → Account Settings → Access Tokens (regenerate); API keys: regenerate at the provider
2. Remove the credential from the repository
3. If it was committed to git history, purge history or rotate the credential (rotation is sufficient in most cases)
4. Review access logs for misuse

## Resources

- [Supabase production security checklist](https://supabase.com/docs/guides/platform/going-into-prod#security)
- [RLS policies guide](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Password security](https://supabase.com/docs/guides/auth/password-security)
