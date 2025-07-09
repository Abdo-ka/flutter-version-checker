# Usage Guide

## Quick Start

### 1. Add the Action to Your Workflow

Create or update `.github/workflows/flutter-ci.yml`:

```yaml
name: Flutter CI with Version Check

on:
  push:
    branches: [ main, release/* ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
        token: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Check Flutter Version
      id: version-check
      uses: Abdo-ka/flutter-version-checker@v1
      with:
        branch: ${{ github.ref_name }}
        token: ${{ secrets.GITHUB_TOKEN }}
    
    # Continue with your Flutter build...
```

### 2. Repository Setup

Ensure your repository has:

- A `pubspec.yaml` file with a version field
- Proper Git history with previous commits
- GitHub token permissions for pushing (automatic with `GITHUB_TOKEN`)

## Real-World Scenarios

### Scenario 1: Production Release Pipeline

```yaml
name: Production Release

on:
  push:
    branches: [ release/production ]

jobs:
  version-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
        token: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Version Check & Auto-Increment
      id: version
      uses: Abdo-ka/flutter-version-checker@v1
      with:
        branch: 'release/production'
        commit-message: 'Release version %NEW_VERSION%'
    
    - name: Build Release
      run: |
        flutter build apk --release
        flutter build ios --release
    
    - name: Deploy to Stores
      if: steps.version.outputs.version-updated == 'true'
      run: |
        echo "Deploying new version: ${{ steps.version.outputs.current-version }}"
        # Your deployment scripts here
```

### Scenario 2: Feature Branch Integration

```yaml
name: Feature Branch CI

on:
  pull_request:
    branches: [ develop ]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
        token: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Version Check
      uses: Abdo-ka/flutter-version-checker@v1
      with:
        branch: 'develop'
        token: ${{ secrets.GITHUB_TOKEN }}
        # This will ensure version compatibility with develop branch
```

## Advanced Configuration

### Custom Pubspec Path

The action always looks for `pubspec.yaml` in the project root directory, which is the standard location for Flutter projects.

### Custom Commit Messages

Use placeholders in your commit message:

```yaml
- name: Check Version
  uses: Abdo-ka/flutter-version-checker@v1
  with:
    commit-message: |
      Auto-increment version to %NEW_VERSION%
      
      Previous: %PREVIOUS_VERSION%
      Branch: ${{ github.ref_name }}
      
      [skip ci]
```

### Multi-Environment Setup

```yaml
strategy:
  matrix:
    environment: [staging, production]
    include:
      - environment: staging
        branch: release/staging
      - environment: production
        branch: release/production

steps:
- name: Check Version for ${{ matrix.environment }}
  uses: Abdo-ka/flutter-version-checker@v1
  with:
    branch: ${{ matrix.branch }}
```

## Troubleshooting

### Common Issues

#### 1. "pubspec.yaml not found"
**Solution**: Ensure your Flutter project has `pubspec.yaml` in the repository root directory.

#### 2. "Permission denied when pushing"
**Solution**: Ensure the workflow has write permissions:

```yaml
permissions:
  contents: write
```

#### 3. "No previous version found"
**Solution**: This is normal for the first run. The action will proceed without incrementing.

#### 4. "Git fetch failed"
**Solution**: Ensure `fetch-depth: 0` is set in your checkout action.

### Debug Mode

Enable debug logging by setting the `ACTIONS_STEP_DEBUG` secret to `true` in your repository.

## Integration Examples

### With Flutter Build

```yaml
- name: Version Check
  id: version
  uses: Abdo-ka/flutter-version-checker@v1

- name: Setup Flutter
  uses: subosito/flutter-action@v2
  
- name: Build with Version
  run: |
    echo "Building version: ${{ steps.version.outputs.current-version }}"
    flutter build apk --build-name=${{ steps.version.outputs.current-version }}
```

### With Slack Notifications

```yaml
- name: Notify Version Update
  if: steps.version.outputs.version-updated == 'true'
  uses: 8398a7/action-slack@v3
  with:
    status: success
    text: |
      Version auto-incremented!
      Previous: ${{ steps.version.outputs.previous-version }}
      New: ${{ steps.version.outputs.current-version }}
```

### With Release Creation

```yaml
- name: Create Release
  if: steps.version.outputs.version-updated == 'true'
  uses: actions/create-release@v1
  with:
    tag_name: v${{ steps.version.outputs.current-version }}
    release_name: Release ${{ steps.version.outputs.current-version }}
    body: |
      Auto-generated release for version ${{ steps.version.outputs.current-version }}
      
      Previous version: ${{ steps.version.outputs.previous-version }}
```

## Best Practices

1. **Always use `fetch-depth: 0`** to get full Git history
2. **Set appropriate branch permissions** for auto-commits
3. **Use `[skip ci]` in commit messages** to avoid infinite loops
4. **Test in a separate branch** before deploying to production
5. **Monitor the action outputs** to understand version changes
6. **Use semantic versioning** for predictable version increments

## Migration from Shell Scripts

If you're currently using shell scripts, here's how to migrate:

### Before (Shell Script)
```yaml
- name: Check Version
  run: |
    # 50+ lines of shell script
    CURRENT_VERSION=$(grep '^version:' pubspec.yaml | sed -E 's/version:[[:space:]]*//')
    # ... complex version checking logic
```

### After (This Action)
```yaml
- name: Check Version
  uses: your-username/flutter-version-checker@v1
  with:
    branch: ${{ github.ref_name }}
```

The action provides the same functionality with better error handling, testing, and maintainability.
