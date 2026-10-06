# Email Templates & OAuth Providers

## Email templates

Branded email templates live in [`email-templates/`](../email-templates/) and are configured in the Supabase dashboard:

| Template file | Supabase template |
| --- | --- |
| `confirm-email.html` | Confirm signup |
| `reset-password.html` | Reset password |
| `magic-link.html` | Magic link sign-in |
| `change-email.html` | Email change confirmation |

### Installing a template

1. Supabase Dashboard → **Authentication → Email Templates**
2. Select the template (e.g. "Confirm signup") → **Edit template**
3. Paste the HTML from the corresponding file → **Save**

Supabase replaces these variables automatically: `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .Token }}`.

### Branding

- Logo: `/y-logo.svg` (hosted at `https://agripath.co/y-logo.svg`) — update the URL in every template if you host it elsewhere
- Primary color: `#16a34a` (Tailwind green-600)
- Headings: Playfair Display; background `#f3f3f3`
- Mobile-responsive with a clear CTA button and security notices

---

## OAuth providers

### Google

Already configured. To rebrand: Google Cloud Console → OAuth 2.0 Client → set authorized domain `agripath.co`, application name "AgriPath", and upload the logo.

### GitHub

1. [GitHub Developer Settings](https://github.com/settings/developers) → **New OAuth App**
   - **Application name:** `AgriPath`
   - **Homepage URL:** `https://agripath.co`
   - **Authorization callback URL:** `https://<project-ref>.supabase.co/auth/v1/callback`
2. Copy the **Client ID** and generate a **Client Secret**
3. Supabase Dashboard → **Authentication → Providers → GitHub** → enable and enter the credentials
4. Test: sign in with GitHub and confirm the redirect and user creation

### Apple

1. Apple Developer Console: create a Service ID and configure Sign in with Apple for `agripath.co`
2. Add the Supabase redirect URL: `https://<project-ref>.supabase.co/auth/v1/callback`
3. Enter the Apple credentials under Supabase → **Authentication → Providers → Apple**

### Callback URLs

Register these with each provider:

- `https://<project-ref>.supabase.co/auth/v1/callback`
- `https://agripath.co/auth/callback` (if using a custom domain)

---

## Verification checklist

- [ ] Email confirmation sends the branded template
- [ ] Password reset and magic link emails render correctly
- [ ] Email change confirmation works
- [ ] Google OAuth shows AgriPath branding
- [ ] GitHub OAuth sign-in works
- [ ] Apple Sign In works
