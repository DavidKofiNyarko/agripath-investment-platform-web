# Development Guide

## Quick Start

Before starting development, always verify your environment:

```bash
# Check you're on the right branch and Supabase project
./scripts/dev-setup.sh
```

## Verifying Your Environment

### 1. Check Git Branch
```bash
git branch --show-current
# Should show: develop (or a feature branch)
# Should NOT show: main
```

### 2. Check Supabase Project
```bash
./scripts/check-supabase-env.sh
# Should show: ✅ Connected to PREVIEW (develop-v2)
# Should NOT show: 🚨 Connected to PRODUCTION
```

### 3. Quick Check (All-in-One)
```bash
./scripts/dev-setup.sh
# Checks both git branch and Supabase environment
```

## Supabase Project References

- **Production (Main):**
  - Project Ref: `gbeqqboxlflpgehyqlld`
  - Branch: `main`
  - ⚠️ **NEVER use for development!**

- **Preview (Develop-v2):**
  - Project Ref: `xiupdgdgsnkxkcpkftad`
  - Branch: `develop-v2`
  - ✅ **Use this for all development!**

## Switching Environments

### Link to Preview (Development)
```bash
supabase link --project-ref xiupdgdgsnkxkcpkftad
```

### Link to Production (Only when deploying)
```bash
supabase link --project-ref gbeqqboxlflpgehyqlld
```

## Daily Workflow

1. **Start of day:**
   ```bash
   ./scripts/dev-setup.sh  # Verify environment
   ```

2. **Before making changes:**
   ```bash
   ./scripts/check-supabase-env.sh  # Double-check Supabase
   ```

3. **Before pushing migrations:**
   ```bash
   ./scripts/check-supabase-env.sh  # Ensure you're on preview
   supabase db push  # Safe to push
   ```

## Safety Checks

The scripts will warn you if:
- ❌ You're on `main` git branch
- ❌ You're connected to production Supabase
- ❌ You're not linked to any Supabase project

## Visual Indicators

When you see:
- ✅ Green checkmarks = Safe to develop
- 🚨 Red warnings = Stop! Check your environment
- ⚠️ Yellow warnings = Review before proceeding

