#!/bin/bash

# Development Setup Script
# Ensures you're working with the correct branches and Supabase environment

echo "🚀 Development Environment Setup"
echo "================================"
echo ""

# Check git branch
CURRENT_GIT_BRANCH=$(git branch --show-current)
echo "📝 Git Branch: $CURRENT_GIT_BRANCH"

if [ "$CURRENT_GIT_BRANCH" = "main" ]; then
    echo "   ⚠️  You're on main branch!"
    echo "   → Switch to develop: git checkout develop"
    echo ""
else
    echo "   ✅ Good! Not on main branch"
    echo ""
fi

# Check Supabase environment
echo "🔍 Checking Supabase environment..."
./scripts/check-supabase-env.sh
SUPABASE_STATUS=$?

echo ""
echo "📋 Summary:"
if [ "$CURRENT_GIT_BRANCH" != "main" ] && [ $SUPABASE_STATUS -eq 0 ]; then
    echo "   ✅ Git: On development branch"
    echo "   ✅ Supabase: Connected to preview"
    echo ""
    echo "   🎉 You're ready for development!"
else
    echo "   ⚠️  Please fix the issues above before continuing"
    exit 1
fi

