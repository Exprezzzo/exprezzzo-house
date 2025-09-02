#!/bin/bash
# GitHub Setup Script for EXPREZZZO Sovereign House

GOLD='\033[1;33m'
GREEN='\033[0;32m'
CHOCOLATE='\033[0;33m'
NC='\033[0m'

echo -e "${GOLD}🏠 EXPREZZZO Sovereign House - GitHub Setup${NC}\n"

echo -e "${CHOCOLATE}Current repository status:${NC}"
git status
echo

echo -e "${CHOCOLATE}Repository is ready for GitHub! Follow these steps:${NC}\n"

echo -e "${GREEN}1. Create a new repository on GitHub:${NC}"
echo "   - Go to https://github.com/new"
echo "   - Repository name: exprezzzo-house"
echo "   - Description: 🏠 EXPREZZZO Sovereign LLM House - Vegas-first, sovereign-always, \$0.001/request immutable"
echo "   - Keep it PUBLIC (for GitHub Actions to work)"
echo "   - DO NOT initialize with README, .gitignore, or license"
echo

echo -e "${GREEN}2. Add the remote origin (replace YOUR_USERNAME):${NC}"
echo "   git remote add origin https://github.com/YOUR_USERNAME/exprezzzo-house.git"
echo

echo -e "${GREEN}3. Push to GitHub:${NC}"
echo "   git push -u origin main"
echo

echo -e "${GREEN}4. Update README badges (replace YOUR_USERNAME):${NC}"
echo "   - Edit README.md and replace YOUR_USERNAME with your GitHub username"
echo "   - Commit and push the changes"
echo

echo -e "${CHOCOLATE}Alternative: Use GitHub CLI (if installed):${NC}"
echo "   gh repo create exprezzzo-house --public --description \"🏠 EXPREZZZO Sovereign LLM House - Vegas-first, sovereign-always, \$0.001/request immutable\""
echo "   git remote add origin https://github.com/\$(gh api user --jq .login)/exprezzzo-house.git"
echo "   git push -u origin main"
echo

echo -e "${GOLD}Repository Summary:${NC}"
echo "📁 Files: $(find . -type f -not -path './node_modules/*' -not -path './.git/*' | wc -l) files ready"
echo "💾 Commits: $(git rev-list --count HEAD) commits prepared"
echo "🎯 Branch: $(git branch --show-current)"
echo "✅ Sovereignty: Maintained"
echo "🌹 Vegas First: Always"