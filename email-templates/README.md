# AgriPath Email Templates & OAuth Configuration

## 📧 Email Templates

Custom email templates have been created for AgriPath with professional branding. These templates need to be configured in your Supabase dashboard.

### Available Templates

1. **confirm-email.html** - Email confirmation for new signups
2. **reset-password.html** - Password reset requests
3. **magic-link.html** - Passwordless sign-in links
4. **change-email.html** - Email address change confirmation

### How to Configure Email Templates in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**
3. For each template type:
   - Click on the template (e.g., "Confirm signup")
   - Click "Edit template"
   - Copy the HTML content from the corresponding file in this directory
   - Paste it into the template editor
   - Click "Save"

### Template Variables

Supabase provides these variables that are automatically replaced:
- `{{ .ConfirmationURL }}` - The confirmation/reset link
- `{{ .Email }}` - User's email address
- `{{ .Token }}` - The confirmation token (if needed)

### Customization

All templates include:
- ✅ AgriPath branding with green gradient header
- ✅ Professional, modern design
- ✅ Mobile-responsive layout
- ✅ Clear call-to-action buttons
- ✅ Security notices where appropriate
- ✅ Footer with agripath.co branding

---

## 🔐 OAuth Provider Configuration

### Currently Supported Providers

1. **Google** - Already configured
2. **Apple** - Needs configuration
3. **GitHub** - Needs configuration

### How to Configure OAuth Providers

#### 1. Google OAuth (Already Set Up)

To customize Google OAuth to show "agripath.co":
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your OAuth 2.0 Client
3. Update **Authorized domains** to include `agripath.co`
4. Update **Application name** to "AgriPath"
5. Add your logo and branding

#### 2. Apple Sign In

1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Enable **Apple** provider
3. Configure in Apple Developer Console:
   - Create a Service ID
   - Configure Sign in with Apple
   - Add `agripath.co` as a domain
   - Add redirect URLs from Supabase
4. Enter your Apple credentials in Supabase

#### 3. GitHub OAuth

**Current Status:** ✅ Frontend buttons added, ⏳ Backend configuration needed

**Setup Steps:**

1. **Create GitHub OAuth App:**
   - Go to: https://github.com/settings/developers
   - Click **"New OAuth App"**
   - **Application name:** `AgriPath`
   - **Homepage URL:** `https://agripath.co`
   - **Authorization callback URL:** `https://gbeqqboxlflpgehyqlld.supabase.co/auth/v1/callback`
   - Click **"Register application"**
   - Copy the **Client ID** and generate a **Client Secret**

2. **Configure in Supabase:**
   - Go to Supabase Dashboard → **Authentication** → **Providers**
   - Enable **GitHub** provider
   - Enter **Client ID** from GitHub
   - Enter **Client Secret** from GitHub
   - Click **Save**

3. **Test:**
   - Try signing in with GitHub on your app
   - Verify redirect works correctly
   - Check that user is created in Supabase

### OAuth Redirect URLs

Make sure these URLs are configured in each provider:
- `https://[your-project-ref].supabase.co/auth/v1/callback`
- `https://agripath.co/auth/callback` (if using custom domain)

---

## 🎨 Branding Customization

All email templates use:
- **Logo**: AgriPath logo from `/y-logo.svg` (hosted at `https://agripath.co/y-logo.svg`)
- **Primary Color**: `#16a34a` (Solid Green - Tailwind green-600)
- **Font**: Playfair Display (Anthropic font) for headings
- **Background**: `#f3f3f3` (matching signin page)
- **Brand Name**: AgriPath
- **Domain**: agripath.co

### Design Features:
- ✅ AgriPath logo displayed in header
- ✅ Playfair Display font for headings (matching signin page)
- ✅ Solid green color (#16a34a) - no gradients
- ✅ Clean, professional design matching your signin page aesthetic
- ✅ Mobile-responsive layout

### Important Note:
The logo URL in templates is set to `https://agripath.co/y-logo.svg`. Make sure:
1. Your logo is accessible at this URL, OR
2. Update the logo URL in all templates to point to your hosted logo location

---

## 📝 Next Steps

1. ✅ Upload email templates to Supabase Dashboard
2. ✅ Configure Apple OAuth in Supabase and Apple Developer Console
3. ✅ Configure GitHub OAuth in Supabase and GitHub
4. ✅ Update Google OAuth branding to show "AgriPath" and agripath.co
5. ✅ Test each email template by triggering the respective actions
6. ✅ Test OAuth flows for all providers

---

## 🧪 Testing

After configuration, test:
- [ ] Email confirmation sends with custom template
- [ ] Password reset sends with custom template
- [ ] Magic link sends with custom template
- [ ] Email change sends with custom template
- [ ] Google OAuth shows "AgriPath" branding
- [ ] Apple Sign In works
- [ ] GitHub OAuth works

