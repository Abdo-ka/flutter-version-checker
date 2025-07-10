# Auto-Increment Version Guide

This guide explains how to automatically increment the pubspec.yaml version and commit/push changes without needing manual token configuration.

## 🚀 Quick Start

### Option 1: Local Script Execution

Run the auto-increment script locally using your existing git authentication:

```bash
# Using npm script
npm run version:increment

# Or directly
node scripts/auto-increment-version.js
```

**Prerequisites:**
- Node.js installed
- Git configured with your credentials
- Current directory is the project root

### Option 2: GitHub Actions (Automatic)

The GitHub workflow will automatically run when you push to main or develop branches.

**File:** `.github/workflows/auto-increment-version.yml`

**Features:**
- Uses default `GITHUB_TOKEN` (no manual token setup required)
- Automatically increments version on every push
- Creates version tags
- Pushes changes back to the repository

## 📋 How It Works

### Version Increment Logic

The script follows this pattern:
- Current version: `1.0.1+2`
- New version: `1.0.2+3` (increments both patch and build number)

### What the Script Does

1. **Reads** current version from `pubspec.yaml`
2. **Increments** patch version and build number
3. **Updates** `pubspec.yaml` with new version
4. **Commits** changes with descriptive message
5. **Creates** a version tag (e.g., `v1.0.2+3`)
6. **Pushes** both commit and tag to repository

## 🔧 Configuration

### Local Git Setup

Ensure git is configured (one-time setup):

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### GitHub Actions Setup

No additional setup required! The workflow uses the default `GITHUB_TOKEN` which is automatically provided by GitHub.

## 📝 Example Output

```
🚀 Flutter Version Auto-Increment Script
=========================================
📦 Current version: 1.0.1+2
📈 New version: 1.0.2+3
✅ Updated pubspec.yaml with version: 1.0.2+3
📝 Staging changes...
💾 Committing changes...
🏷️  Creating tag v1.0.2+3...
🚀 Pushing changes...
🚀 Pushing tag...
🎉 Version successfully incremented and pushed!
📦 New version: 1.0.2+3
🏷️  Tag created: v1.0.2+3
```

## 🛠️ Manual Usage

### Using npm scripts:

```bash
# Auto-increment version
npm run version:increment

# Alternative command
npm run version:auto
```

### Direct script execution:

```bash
node scripts/auto-increment-version.js
```

## 🔍 Troubleshooting

### Common Issues

1. **Git not configured:**
   ```bash
   git config user.name "Your Name"
   git config user.email "your.email@example.com"
   ```

2. **No git authentication:**
   - For HTTPS: Use GitHub personal access token
   - For SSH: Ensure SSH key is configured

3. **Missing dependencies:**
   ```bash
   npm install js-yaml
   ```

### GitHub Actions Issues

1. **Permission denied:** Ensure the workflow has `contents: write` permission (already configured)

2. **Token issues:** The workflow uses `${{ github.token }}` which is automatically provided

## 🎯 Integration Examples

### In CI/CD Pipeline

```yaml
- name: Auto-increment version
  run: npm run version:increment

- name: Build with new version
  run: flutter build apk
```

### Pre-commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/sh
npm run version:increment
git add pubspec.yaml
```

## 📚 API Reference

### Functions Available

- `parseFlutterVersion(versionStr)` - Parse version string
- `incrementVersion(currentVersion)` - Generate next version
- `getCurrentVersion(pubspecPath)` - Read version from pubspec
- `updatePubspecVersion(pubspecPath, newVersion)` - Update pubspec file

### Script Options

The script automatically:
- Detects `pubspec.yaml` in current directory
- Increments patch and build numbers
- Uses existing git configuration
- Creates descriptive commit messages
- Generates version tags

## 🔄 Version History

The script maintains a clear version history with:
- Descriptive commit messages
- Version tags for easy reference
- Automatic changelog generation potential

## 🎉 Benefits

- **No manual version editing** required
- **Consistent version incrementing** 
- **Automatic git operations**
- **No token configuration** needed for local use
- **GitHub Actions integration** ready
- **Version tag creation** for releases
- **Clear commit history** for tracking
