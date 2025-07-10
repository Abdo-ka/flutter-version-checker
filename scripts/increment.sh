#!/bin/bash

# Auto-Increment Version Helper Script
# This script provides an easy way to increment Flutter version and push changes

set -e  # Exit on any error

echo "🚀 Flutter Version Auto-Increment"
echo "================================="

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Check if pubspec.yaml exists
if [ ! -f "pubspec.yaml" ]; then
    echo "❌ Error: pubspec.yaml not found in current directory"
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    exit 1
fi

# Check if the auto-increment script exists
SCRIPT_PATH="scripts/auto-increment-version.js"
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "❌ Error: Auto-increment script not found at $SCRIPT_PATH"
    exit 1
fi

# Show current version
CURRENT_VERSION=$(grep '^version:' pubspec.yaml | sed 's/version: //' | tr -d ' ')
echo "📦 Current version: $CURRENT_VERSION"

# Ask for confirmation
echo ""
read -p "🤔 Do you want to auto-increment the version and push changes? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "🚫 Operation cancelled"
    exit 0
fi

echo ""
echo "🏃 Running auto-increment script..."

# Run the Node.js script
node "$SCRIPT_PATH"

echo ""
echo "✅ Done! Check the git log to see the changes:"
echo "   git log --oneline -3"
echo ""
echo "🏷️  To see tags:"
echo "   git tag --sort=-version:refname | head -5"
