# Development Workflow

## Overview

**Main Branch = Production Only**
- ✅ Stable, production-ready code
- ✅ Only updated via Pull Requests from `develop`
- ✅ Never used for testing or development

**Develop Branch = Development & Testing**
- ✅ All new features and changes
- ✅ Testing and experimentation
- ✅ Supabase preview branches created from here
- ✅ Regular commits and pushes

## Development Process

### 1. Daily Development Workflow

```bash
# Always start from develop branch
git checkout develop
git pull origin develop

# Create a feature branch for your work
git checkout -b feature/your-feature-name

# Make your changes, test, commit
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature-name

# When ready, merge back to develop
git checkout develop
git merge feature/your-feature-name
git push origin develop
```

### 2. Supabase Preview Branches

**Always create preview branches from `develop`, never from `main`:**

```bash
# Using Supabase CLI
supabase link --project-ref your-preview-project-ref

# Or via Supabase Dashboard:
# - Source branch: develop
# - Never use main for previews
```

**Testing in Preview:**
- All database migrations tested in preview branches
- All API changes tested in preview branches
- All UI changes tested in preview branches
- Only merge to main when everything is verified

### 3. Merging to Main (Production)

**Only when code is production-ready:**

```bash
# 1. Ensure develop is stable and tested
git checkout develop
git pull origin develop

# 2. Create PR from develop to main
# Go to: https://github.com/Inov8te/agripath-webapp/compare/main...develop

# 3. Review checklist:
# ✅ All tests passing
# ✅ Preview branch tested and working
# ✅ No breaking changes
# ✅ Documentation updated
# ✅ At least 1 approval

# 4. Merge PR to main
# 5. Tag release if needed
```

## Supabase Workflow

### Preview Branch Setup

1. **Create preview branch from develop:**
   ```bash
   # In Supabase Dashboard or CLI
   # Source: develop branch
   # Name: develop-preview or feature-preview
   ```

2. **Test migrations:**
   ```bash
   # Link to preview branch
   supabase link --project-ref preview-project-ref
   
   # Push migrations
   supabase db push
   
   # Test everything works
   ```

3. **When ready for production:**
   - Merge develop → main
   - Apply migrations to production Supabase project
   - Verify in production

### Current Setup

- **Main Supabase Project:** `gbeqqboxlflpgehyqlld` (Production)
  - Linked to: `main` branch
  - Used for: Production only

- **Preview Branches:** (e.g., `develop-v2`)
  - Linked to: `develop` branch
  - Used for: Development and testing

## Best Practices

### ✅ DO:
- Always work in `develop` or feature branches
- Test everything in preview branches first
- Use preview branches for Supabase testing
- Create PRs to merge develop → main
- Review code before merging to main

### ❌ DON'T:
- Commit directly to `main`
- Use `main` for Supabase preview branches
- Merge untested code to `main`
- Force push to `main`
- Delete `main` branch

## Quick Commands

```bash
# Start new feature
git checkout develop
git pull
git checkout -b feature/my-feature

# Work and test
# ... make changes ...

# Push to develop
git checkout develop
git merge feature/my-feature
git push origin develop

# Test in Supabase preview
supabase link --project-ref preview-ref
supabase db push

# When ready, create PR: develop → main
```

## Emergency Hotfixes

If you need to fix production immediately:

```bash
# 1. Create hotfix branch from main
git checkout main
git pull
git checkout -b hotfix/critical-fix

# 2. Make fix
# ... fix code ...

# 3. Test in preview
# 4. Merge hotfix → main (via PR)
# 5. Also merge hotfix → develop (to keep in sync)
```

