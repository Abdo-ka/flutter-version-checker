# Git Troubleshooting Guide

## Common Issues and Solutions

### 1. "Refusing to fetch into branch checked out" Error

**Problem**: The git fetch command fails with `fatal: refusing to fetch into branch 'refs/heads/release/staging' checked out at '/home/runner/work/WeHealthFlutter/WeHealthFlutter'`

**Solution**: The action now uses safer fetch commands that avoid this issue:
- Uses `git fetch origin branch` instead of `git fetch origin branch:branch`
- Falls back to `git fetch origin` if the specific branch fetch fails
- Handles shallow repositories by unshallowing when needed

### 2. "Process '/usr/bin/git' failed with exit code 128" Error

**Problem**: Git operations fail during push with exit code 128.

**Root Causes & Solutions**:

#### Authentication Issues
- **Ensure proper token permissions**: The GitHub token needs `contents: write` permission
- **Use correct token**: Pass `${{ secrets.GITHUB_TOKEN }}` or a PAT with proper permissions

#### Workflow Permissions
Add this to your workflow file:
```yaml
permissions:
  contents: write  # Required for pushing changes
  pull-requests: read  # Optional, for PR context
```

#### Branch Protection Rules
- Ensure the target branch allows pushes from actions
- Check if branch protection rules require PR reviews
- Consider using a different branch for version updates

### 3. Authentication Configuration

The action automatically configures git authentication using the provided token:
```javascript
const authenticatedUrl = `https://x-access-token:${token}@github.com/${owner}/${repo}.git`;
await execGit(['remote', 'set-url', 'origin', authenticatedUrl], true);
```

### 4. Recommended Workflow Setup

```yaml
name: Flutter Version Check
on:
  push:
    branches: [release/staging]

permissions:
  contents: write
  
jobs:
  version-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Important: fetch full history
          token: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Flutter Version Checker
        uses: your-username/flutter-version-checker@v1
        with:
          branch: release/staging
          token: ${{ secrets.GITHUB_TOKEN }}
          commit-message: "Auto-increment version"
```

### 5. Key Improvements Made

1. **Safer Git Operations**: 
   - Improved fetch commands to avoid checkout conflicts
   - Better error handling with fallback strategies
   - Enhanced authentication setup

2. **Better Error Reporting**:
   - More detailed error messages
   - Git status debugging information
   - Clearer failure reasons

3. **Robust Push Strategy**:
   - Multiple push approaches if the first fails
   - Better handling of different repository states
   - Improved tag creation and pushing

### 6. Debug Information

When errors occur, the action now provides:
- Detailed git command output
- Current repository status
- Remote configuration information
- Specific error codes and messages

This helps diagnose issues more effectively.
