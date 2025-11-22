#!/bin/bash
# Script to set up branch protection for main branch
# Requires: GitHub Personal Access Token with repo admin permissions
# Usage: GITHUB_TOKEN=your_token ./setup-branch-protection.sh

REPO="Inov8te/agripath-webapp"
BRANCH="main"

if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ GITHUB_TOKEN environment variable is required"
  echo ""
  echo "To get a token:"
  echo "  1. Go to: https://github.com/settings/tokens"
  echo "  2. Generate new token (classic)"
  echo "  3. Select scope: repo (Full control of private repositories)"
  echo "  4. Run: GITHUB_TOKEN=your_token ./setup-branch-protection.sh"
  exit 1
fi

echo "Setting up branch protection for $BRANCH in $REPO..."

curl -X PUT \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/$REPO/branches/$BRANCH/protection" \
  -d '{
    "required_status_checks": {
      "strict": true,
      "contexts": []
    },
    "enforce_admins": true,
    "required_pull_request_reviews": {
      "dismiss_stale_reviews": true,
      "require_code_owner_reviews": false,
      "required_approving_review_count": 1
    },
    "restrictions": null,
    "allow_force_pushes": false,
    "allow_deletions": false
  }'

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Branch protection set successfully!"
else
  echo ""
  echo "❌ Failed to set protection. Check:"
  echo "  - Token has admin access to the repository"
  echo "  - Repository name is correct"
  echo "  - You have permission to modify branch protection"
fi

