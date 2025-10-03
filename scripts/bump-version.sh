#!/bin/bash

# Tag-Based Version Bump Script for Flutter Projects
# This script checks the latest git tag and bumps the version in pubspec.yaml accordingly

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_SCRIPT="$SCRIPT_DIR/tag-based-version-bump.js"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    echo "Please install Node.js to use this script"
    exit 1
fi

# Check if the Node.js script exists
if [ ! -f "$NODE_SCRIPT" ]; then
    echo "❌ Node.js script not found: $NODE_SCRIPT"
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository"
    exit 1
fi

# Check if pubspec.yaml exists
if [ ! -f "pubspec.yaml" ]; then
    echo "❌ pubspec.yaml not found in current directory"
    echo "Please run this script from your Flutter project root"
    exit 1
fi

# Run the Node.js script with all passed arguments
exec node "$NODE_SCRIPT" "$@"