#!/bin/bash

# EXPREZZZO Navigation Switcher
# Usage: ./switch-nav.sh [original|emoji|compact]

NAV_TYPE=${1:-compact}
COMPONENTS_DIR="components"

case $NAV_TYPE in
  "emoji")
    echo "🎰 Switching to Enhanced Emoji Navigation..."
    cp $COMPONENTS_DIR/EmojiNavigation.tsx $COMPONENTS_DIR/Navigation.tsx
    echo "✅ Emoji navigation activated! Rich animations and individual room colors."
    ;;
  "compact")
    echo "🎰 Switching to Compact Navigation (your original style)..."
    cp $COMPONENTS_DIR/CompactNavigation.tsx $COMPONENTS_DIR/Navigation.tsx
    echo "✅ Compact navigation activated! Clean, mobile-first design."
    ;;
  "original")
    echo "🎰 Restoring Original EXPREZZZO Navigation..."
    git checkout $COMPONENTS_DIR/Navigation.tsx 2>/dev/null || echo "⚠️  Original not in git, keeping current"
    echo "✅ Original navigation restored! Lucide icons and full features."
    ;;
  *)
    echo "❌ Invalid option. Use: original, emoji, or compact"
    echo "Example: ./switch-nav.sh compact"
    exit 1
    ;;
esac

echo ""
echo "🏠 Navigation switched successfully!"
echo "Visit http://localhost:3000/nav-demos to see all options"
echo "🎲 What happens in Vegas... gets beautiful navigation!"