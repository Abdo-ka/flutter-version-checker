# Fixing "exit code 128" Git Errors

## 🚀 NEW: No Token Required!

The action now automatically uses the GitHub token from the environment. You don't need to pass any token!

**Simple Usage:**
```yaml
permissions:
  contents: write  # This is all you need!

jobs:
  auto-version:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - uses: your-username/flutter-version-checker@v1
        with:
          branch: ${{ github.ref_name }}
          # No token needed! 🎉
```

## Quick Fix Checklist

✅ **1. Add Workflow Permissions** (Most Important)
```yaml
permissions:
  contents: write      # Required for pushing commits
  actions: read        # Required for workflow execution
  metadata: read       # Required for repository metadata
```

✅ **2. Use Proper Checkout Configuration**
```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0  # Get full git history
    token: ${{ secrets.GITHUB_TOKEN }}
    persist-credentials: true
```

✅ **3. Pass GitHub Token Correctly**
```yaml
- uses: your-username/flutter-version-checker@v1
  with:
    branch: ${{ github.ref_name }}
    token: ${{ secrets.GITHUB_TOKEN }}  # Make sure this is passed
```

## Common Causes of Exit Code 128

### 1. Missing Workflow Permissions
**Error**: `fatal: could not read Username for 'https://github.com'`
**Solution**: Add `contents: write` permission to your workflow

### 2. Insufficient Token Permissions
**Error**: `remote: Permission to user/repo.git denied`
**Solution**: Ensure `GITHUB_TOKEN` has write access or use a PAT

### 3. Branch Protection Rules
**Error**: `remote: error: GH006: Protected branch update failed`
**Solution**: 
- Configure branch protection to allow Actions to push
- Or use a different branch for version updates

### 4. Shallow Repository
**Error**: `fatal: refusing to fetch into branch`
**Solution**: Use `fetch-depth: 0` in checkout action

## Repository Settings to Check

1. **Actions Permissions**: Go to Settings → Actions → General
   - Ensure "Allow GitHub Actions to create and approve pull requests" is enabled
   - Set "Workflow permissions" to "Read and write permissions"

2. **Branch Protection**: Go to Settings → Branches
   - Allow force pushes for automated commits
   - Or exclude the action from required status checks

## Alternative Solutions

### Option 1: Use Personal Access Token (PAT)
```yaml
- uses: actions/checkout@v4
  with:
    token: ${{ secrets.PAT_TOKEN }}  # Instead of GITHUB_TOKEN

- uses: your-action
  with:
    token: ${{ secrets.PAT_TOKEN }}
```

### Option 2: Use Different Branch for Version Updates
```yaml
- uses: your-action
  with:
    branch: version-updates  # Push to different branch
    token: ${{ secrets.GITHUB_TOKEN }}
```

### Option 3: Skip CI on Version Commits
Add `[skip ci]` to commit messages to prevent infinite loops:
```yaml
commit-message: "Auto-increment version [skip ci]"
```

## Testing Your Fix

Use the debug workflow (`examples/debug-workflow.yml`) to test your configuration:

```bash
# Copy the debug workflow to your .github/workflows/ folder
cp examples/debug-workflow.yml .github/workflows/debug-git.yml

# Commit and push, then manually trigger the workflow
git add .github/workflows/debug-git.yml
git commit -m "Add debug workflow"
git push

# Go to Actions tab and manually run "Debug Git Issues" workflow
```

## Still Having Issues?

1. Check the action logs for specific error messages
2. Verify your repository permissions
3. Try the debug workflow to gather more information
4. Consider using a Personal Access Token instead of GITHUB_TOKEN

## Working Example

See `examples/fixed-auth-workflow.yml` for a complete working example with proper permissions and configuration.
