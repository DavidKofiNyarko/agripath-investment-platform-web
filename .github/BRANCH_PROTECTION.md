# Branch Protection Guide

## Main Branch Protection

The `main` branch is protected and should **NEVER** be used for:
- Testing
- Development
- Direct commits
- Experimental changes

## Development Workflow

1. **Always use `develop` branch** for:
   - Feature development
   - Testing
   - Supabase preview branches
   - Experimental changes

2. **Main branch is for:**
   - Production-ready code only
   - Merged changes from `develop` via Pull Request
   - Stable releases

## Supabase Branch Configuration

- **Preview branches** should be created from `develop`, not `main`
- **Default branch** for Supabase previews: `develop`
- **Main branch** should only be used for production Supabase project

## How to Work Safely

1. Always checkout `develop` branch:
   ```bash
   git checkout develop
   ```

2. Create feature branches from `develop`:
   ```bash
   git checkout -b feature/your-feature-name develop
   ```

3. Never commit directly to `main`
4. Always use Pull Requests to merge to `main`

