# ✨ Zero-Configuration Auto-Commit Setup

## 🎯 Super Simple Usage (No Token Required!)

Your action now automatically uses the GitHub token that's available in every GitHub Actions workflow. You don't need to pass any token!

### Minimal Workflow Setup

```yaml
name: Auto-Version Flutter App
on:
  push:
    branches: [main]

# Only requirement: write permissions
permissions:
  contents: write

jobs:
  auto-version:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      # That's it! No token needed
      - uses: your-username/flutter-version-checker@v1
        with:
          branch: main
          # No token parameter - automatically uses GITHUB_TOKEN!
```

## 🔧 How It Works

1. **Automatic Token Detection**: The action automatically detects and uses `GITHUB_TOKEN` from the environment
2. **Zero Configuration**: You don't need to pass `${{ secrets.GITHUB_TOKEN }}` or any token
3. **Automatic Permissions**: As long as your workflow has `contents: write` permission, it will work
4. **Backward Compatible**: If you prefer to pass a token explicitly, that still works

## 📋 What You Need

✅ **Only Requirement**: Add `permissions: contents: write` to your workflow

❌ **No Longer Needed**:
- Passing `token: ${{ secrets.GITHUB_TOKEN }}`
- Setting up secrets or PATs
- Complex authentication setup

## 🚀 Complete Working Example

```yaml
name: Flutter Auto-Version & Build
on:
  push:
    branches: [main, develop]

permissions:
  contents: write  # This is all you need!

jobs:
  auto-version-and-build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Auto-increment version
        id: version
        uses: your-username/flutter-version-checker@v1
        with:
          branch: ${{ github.ref_name }}
          commit-message: "🚀 Auto-bump version"
      
      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: 3.24.0
      
      - name: Build
        run: |
          flutter pub get
          flutter build apk --release
      
      - name: Show results
        run: |
          echo "Version was updated: ${{ steps.version.outputs.version-updated }}"
          echo "New version: ${{ steps.version.outputs.current-version }}"
```

## ⚡ Advanced Options (All Optional)

```yaml
- uses: your-username/flutter-version-checker@v1
  with:
    branch: main                              # Default: 'main'
    commit-message: "Custom message"          # Default: 'Auto-increment version'
    git-user-email: "custom@example.com"     # Default: 'action@github.com'
    git-user-name: "Custom Bot"              # Default: 'GitHub Action Auto-Fix'
    # token: still supported if you want to override
```

## 🔍 Troubleshooting

### "No token available" Warning
**Cause**: Your workflow doesn't have write permissions
**Solution**: Add `permissions: contents: write` to your workflow

### Exit Code 128 Error
**Cause**: Missing permissions or authentication issues
**Solution**: 
1. Add `permissions: contents: write`
2. Use `fetch-depth: 0` in checkout
3. Check branch protection rules

### Version Not Committed
**Cause**: No token available or insufficient permissions
**Solution**: The action will update `pubspec.yaml` locally for your build, but won't commit without proper permissions

## 🎉 Benefits

- ✅ **Simpler**: No token configuration needed
- ✅ **Secure**: Uses built-in GitHub authentication
- ✅ **Reliable**: Automatic fallback if no token available
- ✅ **Compatible**: Works with existing setups
- ✅ **Zero Setup**: Just add permissions and go!
