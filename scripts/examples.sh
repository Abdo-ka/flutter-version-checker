#!/bin/bash

# Example usage script for tag-based version bumping
# This script demonstrates common usage patterns

echo "🚀 Flutter Version Bump Examples"
echo "================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUMP_SCRIPT="$SCRIPT_DIR/bump-version.sh"

# Function to show current status
show_status() {
    echo ""
    echo "📊 Current Status:"
    echo "   Version in pubspec.yaml: $(grep '^version:' pubspec.yaml | sed 's/version: //')"
    echo "   Latest git tag: $(git describe --tags --abbrev=0 2>/dev/null || echo 'No tags found')"
    echo ""
}

# Function to run example with explanation
run_example() {
    local description="$1"
    local command="$2"
    
    echo "🔹 $description"
    echo "   Command: $command"
    echo "   Output:"
    echo "   ────────"
    eval "$command" | sed 's/^/   /'
    echo ""
    echo "   ────────"
    echo ""
}

# Show initial status
show_status

echo "📋 Available Examples:"
echo ""

# Example 1: Dry run
run_example "1. Preview what would happen (dry run)" \
    "$BUMP_SCRIPT --dry-run"

# Example 2: Auto bump
if [ "$1" != "--dry-only" ]; then
    read -p "Would you like to continue with actual version bumps? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        
        # Example 3: Build number increment
        run_example "2. Increment build number only" \
            "$BUMP_SCRIPT --bump-type build"
        
        show_status
        
        # Example 4: Patch version bump
        run_example "3. Increment patch version" \
            "$BUMP_SCRIPT --bump-type patch"
        
        show_status
        
        # Example 5: Minor version bump with tag
        run_example "4. Increment minor version and create tag" \
            "$BUMP_SCRIPT --bump-type minor --create-tag"
        
        show_status
        
        echo "✅ Examples completed!"
        echo ""
        echo "💡 Useful commands:"
        echo "   View all tags: git tag --list"
        echo "   View latest tag: git describe --tags --abbrev=0"
        echo "   View version history: git log --oneline --grep='Auto-increment'"
        
    else
        echo "Skipping actual version bumps. Use --dry-run to safely test commands."
    fi
else
    echo "Dry-run only mode. No actual changes will be made."
fi

echo ""
echo "🔗 For more information, see TAG_BASED_VERSION_BUMP.md"