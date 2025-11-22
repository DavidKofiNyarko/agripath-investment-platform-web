#!/bin/bash

# Supabase Environment Checker
# Verifies you're working with the correct Supabase preview branch (develop-v2)
# and not the production main branch

echo "🔍 Checking Supabase Environment..."
echo "=================================="
echo ""

# Production project ref (main branch)
PROD_PROJECT_REF="gbeqqboxlflpgehyqlld"
PROD_BRANCH="main"

# Preview project ref (develop-v2 branch)
PREVIEW_PROJECT_REF="xiupdgdgsnkxkcpkftad"
PREVIEW_BRANCH="develop-v2"

# Check if Supabase is linked
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not installed"
    echo "   Install: npm install -g supabase"
    exit 1
fi

# Get current project ref
CURRENT_PROJECT_REF=$(supabase status --output json 2>/dev/null | grep -o '"project_ref":"[^"]*"' | cut -d'"' -f4)

if [ -z "$CURRENT_PROJECT_REF" ]; then
    # Try alternative method
    if [ -f "supabase/.temp/project-ref" ]; then
        CURRENT_PROJECT_REF=$(cat supabase/.temp/project-ref)
    elif [ -f ".supabase/project-ref" ]; then
        CURRENT_PROJECT_REF=$(cat .supabase/project-ref)
    else
        echo "⚠️  Not linked to any Supabase project"
        echo ""
        echo "To link to develop-v2 preview:"
        echo "   supabase link --project-ref $PREVIEW_PROJECT_REF"
        echo ""
        exit 1
    fi
fi

echo "📊 Current Status:"
echo "   Project Ref: $CURRENT_PROJECT_REF"
echo ""

# Check which project we're connected to
if [ "$CURRENT_PROJECT_REF" = "$PROD_PROJECT_REF" ]; then
    echo "🚨 WARNING: You are connected to PRODUCTION!"
    echo "   Project: Main (Production)"
    echo "   Branch: $PROD_BRANCH"
    echo ""
    echo "   ⚠️  This is the production database!"
    echo "   ⚠️  Be very careful with any changes!"
    echo ""
    echo "   To switch to preview:"
    echo "   supabase link --project-ref $PREVIEW_PROJECT_REF"
    echo ""
    exit 1
elif [ "$CURRENT_PROJECT_REF" = "$PREVIEW_PROJECT_REF" ]; then
    echo "✅ You are connected to PREVIEW (develop-v2)"
    echo "   Project: Preview Branch"
    echo "   Branch: $PREVIEW_BRANCH"
    echo ""
    echo "   ✅ Safe for development and testing"
    echo "   ✅ This is the correct environment for development"
    echo ""
    exit 0
else
    echo "⚠️  Unknown project reference: $CURRENT_PROJECT_REF"
    echo ""
    echo "Expected:"
    echo "   Production: $PROD_PROJECT_REF (main)"
    echo "   Preview: $PREVIEW_PROJECT_REF (develop-v2)"
    echo ""
    echo "To link to preview:"
    echo "   supabase link --project-ref $PREVIEW_PROJECT_REF"
    echo ""
    exit 1
fi

