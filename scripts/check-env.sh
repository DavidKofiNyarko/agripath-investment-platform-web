#!/bin/bash

# Check Supabase Environment
# This script helps verify you're working with the correct Supabase project
# Script to verify you're working with the correct Supabase preview branch
# Usage: ./scripts/check-env.sh

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🔍 Checking Development Environment..."
echo "=================================="
echo ""

# Check current git branch
GIT_BRANCH=$(git branch --show-current 2>/dev/null)
if [ "$GIT_BRANCH" = "develop" ] || [ "$GIT_BRANCH" = "main" ]; then
    echo -e "${BLUE} Git Branch:${NC} $GIT_BRANCH"
else
    echo -e "${BLUE} Git Branch:${NC} $GIT_BRANCH (feature branch)"
fi

# Check Supabase project
if [ -f "supabase/.temp/project-ref" ]; then
    SUPABASE_REF=$(cat supabase/.temp/project-ref 2>/dev/null)
    echo -e "${BLUE}🔗 Supabase Project Ref:${NC} $SUPABASE_REF"
    
    # Known project refs
    MAIN_PROJECT="gbeqqboxlflpgehyqlld"
    DEVELOP_V2="xiupdgdgsnkxkcpkftad"
    
    if [ "$SUPABASE_REF" = "$DEVELOP_V2" ]; then
        echo -e "${GREEN}✅ Linked to develop-v2 preview branch${NC}"
        echo -e "${GREEN}   Safe for development and testing${NC}"
    elif [ "$SUPABASE_REF" = "$MAIN_PROJECT" ]; then
        echo -e "${RED}⚠️  WARNING: Linked to MAIN production project!${NC}"
        echo -e "${RED}   This is PRODUCTION - be very careful!${NC}"
    else
        echo -e "${YELLOW}⚠️  Unknown project ref${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Not linked to any Supabase project${NC}"
    echo "   Run: supabase link --project-ref xiupdgdgsnkxkcpkftad"
fi

echo ""
echo "=================================="

# Check if we can get project info via Supabase CLI
if command -v supabase > /dev/null 2>&1; then
    echo ""
    echo "📊 Supabase Status:"
    supabase status 2>&1 | grep -E "(Project|API URL|DB URL)" || echo "   Run 'supabase status' for details"
fi

echo ""
echo "💡 Quick Commands:"
echo "   Link to develop-v2: supabase link --project-ref xiupdgdgsnkxkcpkftad"
echo "   Check status: supabase status"
echo "   Push migrations: supabase db push"

