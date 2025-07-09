# Flutter Version Checker - Common Scenarios & Troubleshooting

## 🎯 Common Use Cases

### 1. Automatic Version Increment on Main Branch

```yaml
- name: Auto-increment version on main
  uses: Abdo-ka/flutter-version-checker@v1
  with:
    branch: main
    token: ${{ secrets.GITHUB_TOKEN }}
```

**What happens:**
- Checks if current version in `pubspec.yaml` is greater than the last version in main branch
- If not, automatically increments patch version and build number
- Commits and pushes the change
- Creates a version tag

### 2. Different Branches with Different Rules

```yaml
- name: Version check for feature branches
  uses: Abdo-ka/flutter-version-checker@v1
  with:
    branch: develop  # Check against develop branch history
    token: ${{ secrets.GITHUB_TOKEN }}
    commit-message: "🔧 Update version for feature branch"
```

### 3. Custom Commit Messages

```yaml
- name: Version check with custom message
  uses: Abdo-ka/flutter-version-checker@v1
  with:
    branch: ${{ github.ref_name }}
    token: ${{ secrets.GITHUB_TOKEN }}
    commit-message: |
      🚀 Release v{{ new_version }}
      
      - Auto-incremented from {{ previous_version }}
      - Ready for deployment
      - [skip ci]
```

## 🔧 Configuration Options

### Required Inputs

| Input | Description | Example |
|-------|-------------|---------|
| `token` | GitHub token for authentication | `${{ secrets.GITHUB_TOKEN }}` |

### Optional Inputs

| Input | Description | Default | Example |
|-------|-------------|---------|---------|
| `branch` | Branch to check version history against | `main` | `develop`, `release/v1.0` |
| `commit-message` | Custom commit message for auto-increments | `Auto-increment version` | `🚀 Bump version [skip ci]` |

### Outputs

| Output | Description | Example |
|--------|-------------|---------|
| `previous-version` | Previous version found in history | `1.2.3+45` |
| `current-version` | Current version after processing | `1.2.4+46` |
| `version-updated` | Whether version was auto-updated | `true` / `false` |
| `new-version` | New version if updated | `1.2.4+46` |

## 🧩 Integration Examples

### With Flutter Build

```yaml
jobs:
  version-check:
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.check.outputs.current-version }}
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
        token: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Check version
      id: check
      uses: Abdo-ka/flutter-version-checker@v1
      with:
        branch: main
        token: ${{ secrets.GITHUB_TOKEN }}

  build:
    needs: version-check
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        ref: ${{ github.ref }}  # Get updated version
    
    - name: Build with version ${{ needs.version-check.outputs.version }}
      run: flutter build apk --build-name=${{ needs.version-check.outputs.version }}
```

### With Conditional Deployment

```yaml
- name: Deploy only if version was updated
  if: steps.version-check.outputs.version-updated == 'true'
  run: |
    echo "Deploying new version: ${{ steps.version-check.outputs.new-version }}"
    # Your deployment script here
```

## 🚨 Troubleshooting

### Problem: "Git authentication failed"

**Solution:** Ensure you're using a valid GitHub token with write permissions:

```yaml
- uses: actions/checkout@v4
  with:
    token: ${{ secrets.GITHUB_TOKEN }}  # Built-in token
    # OR use a personal access token:
    # token: ${{ secrets.PERSONAL_ACCESS_TOKEN }}
```

### Problem: "Shallow repository" errors

**Solution:** Always use `fetch-depth: 0` to get full history:

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0  # This is crucial!
    token: ${{ secrets.GITHUB_TOKEN }}
```

### Problem: "No previous version found"

**Expected behavior:** This happens on first run or new repositories. The action will:
- Continue successfully
- Set `version-updated` to `false`
- Use current version as-is

### Problem: Version not incrementing as expected

**Check these:**
1. Ensure `pubspec.yaml` has a valid `version:` field
2. Version format should be `MAJOR.MINOR.PATCH+BUILD` (e.g., `1.0.0+1`)
3. The action compares against the specified branch history

### Problem: "Permission denied" on push

**Solutions:**
1. Ensure workflow has write permissions:
```yaml
permissions:
  contents: write
  actions: read
```

2. Or use a Personal Access Token with repository write access

### Problem: Action triggered infinite loops

**Solution:** Add `[skip ci]` to auto-generated commit messages:

```yaml
commit-message: "🚀 Auto-increment version [skip ci]"
```

## 📝 Version Format Requirements

The action expects Flutter version format: `MAJOR.MINOR.PATCH+BUILD`

**Valid examples:**
- `1.0.0+1`
- `2.5.10+150`
- `50.8.47+177`

**Invalid examples:**
- `1.0.0` (missing build number)
- `v1.0.0+1` (extra 'v' prefix)
- `1.0+1` (missing patch number)

## 🎛️ Advanced Configuration

### For Multiple Flutter Projects

```yaml
matrix:
  project: [app1, app2, lib1]
steps:
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
    token: ${{ secrets.GITHUB_TOKEN }}

- name: Check version for ${{ matrix.project }}
  uses: Abdo-ka/flutter-version-checker@v1
  with:
    branch: main
    token: ${{ secrets.GITHUB_TOKEN }}
  working-directory: ./${{ matrix.project }}
```

### For Release Branches

```yaml
- name: Check version for release
  if: startsWith(github.ref, 'refs/heads/release/')
  uses: Abdo-ka/flutter-version-checker@v1
  with:
    branch: main  # Always check against main
    token: ${{ secrets.GITHUB_TOKEN }}
    commit-message: "📦 Prepare release version"
```

## 🔍 Debug Mode

To get more detailed logs, add debug output:

```yaml
- name: Enable debug logging
  run: echo "ACTIONS_RUNNER_DEBUG=true" >> $GITHUB_ENV

- name: Check version with debug
  uses: Abdo-ka/flutter-version-checker@v1
  with:
    branch: main
    token: ${{ secrets.GITHUB_TOKEN }}
```
