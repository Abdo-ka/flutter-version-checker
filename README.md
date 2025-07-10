# Flutter Version Checker & Auto-Increment Action

🎉 **Now 100% Token-Free!** No more authentication headaches - just add `permissions: contents: write` and you're done!

A GitHub Action that automatically checks Flutter version numbers in `pubspec.yaml` against branch history and auto-increments them if needed. This action ensures that each build has a unique, incrementally increasing version number.

## ✨ Features

- **🔍 Version History Check**: Scans branch commit history to find previous versions
- **📈 Auto-Increment**: Automatically increments patch and build numbers when needed
- **🧠 Smart Comparison**: Handles semantic versioning with build numbers (e.g., `50.8.47+177`)
- **🚀 Auto-Commit**: Commits and pushes version changes automatically with tags
- **📊 Detailed Outputs**: Provides previous, current, and new version information
- **⚙️ Flexible Configuration**: Customizable branch, pubspec path, and commit messages
- **🆓 Token-Free**: Uses GitHub Actions built-in authentication - no tokens needed!
- **🏷️ Git Tags**: Automatically creates version tags for releases

## 🚀 Quick Start (Token-Free!)

```yaml
name: Auto-Version Flutter App

on:
  push:
    branches: [ main ]

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
          
      - name: Auto-increment version
        uses: Abdo-ka/flutter-version-checker@v1
        with:
          branch: main
          
      - name: Build Flutter app
        run: |
          flutter pub get
          flutter build apk
```

That's it! No tokens, no complex setup. Just works! ✨

## How It Works

1. **Fetches History**: The action fetches the specified branch history
2. **Finds Previous Version**: Scans recent commits to find the last version in `pubspec.yaml`
3. **Compares Versions**: Uses semantic versioning to compare current vs previous
4. **Auto-Increments**: If current ≤ previous, automatically increments the version
5. **Commits Changes**: Pushes the updated `pubspec.yaml` with a descriptive commit
6. **Creates Tags**: Adds version tags for easy release tracking
7. **Continues Workflow**: Your CI/CD continues with the corrected version

## 📖 Complete Examples

### Token-Free Usage (Recommended)

```yaml
name: Flutter CI/CD

on:
  push:
    branches: [ main, develop ]

permissions:
  contents: write  # Only requirement!

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Auto-increment version
        id: version
        uses: Abdo-ka/flutter-version-checker@v1
      with:
        branch: ${{ github.ref_name }}
        token: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Continue with your CI/CD
      run: |
        echo "Version: ${{ steps.version-check.outputs.current-version }}"
        echo "Was updated: ${{ steps.version-check.outputs.version-updated }}"
        # Your Flutter build, test, and deployment steps here
```

### Advanced Usage

```yaml
- name: Check and Auto-Increment Flutter Version
  id: version-check
  uses: Abdo-ka/flutter-version-checker@v1
  with:
    branch: 'release/production'
    token: ${{ secrets.GITHUB_TOKEN }}
    commit-message: 'Auto-increment version to %NEW_VERSION% [skip ci]'
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `branch` | The branch to check version history against | Yes | `main` |
| `token` | GitHub token for pushing changes | Yes | `${{ github.token }}` |
| `commit-message` | Custom commit message for version updates | No | `Auto-increment version` |

## Outputs

| Output | Description |
|--------|-------------|
| `previous-version` | The previous version found in branch history |
| `current-version` | The current version after processing |
| `version-updated` | Whether the version was automatically updated (`true`/`false`) |
| `new-version` | The new version if updated |

## Version Format

This action supports Flutter's standard version format:

```
major.minor.patch+build
```

Examples:
- `1.0.0+1`
- `50.8.47+177`
- `2.1.5+42`

## How It Works

1. **Read Current Version**: Extracts version from `pubspec.yaml` in project root
2. **Fetch Branch History**: Retrieves commit history for the specified branch
3. **Find Previous Version**: Scans commits to find the most recent different version
4. **Compare Versions**: Uses semantic versioning comparison with build number support
5. **Auto-Increment**: If current ≤ previous, increments patch and build numbers
6. **Update & Commit**: Updates `pubspec.yaml`, commits the change, and creates a version tag
7. **Continue CI/CD**: Allows the workflow to continue with the correct version

## Version Increment Logic

When a version needs to be incremented:

- **Previous**: `50.8.47+177`
- **Current**: `50.8.47+177` (same or lower)
- **New**: `50.8.48+178`

The action increments:
- Patch version by 1
- Build number by 1

## Example Scenarios

### Scenario 1: Version Already Incremented
```
Previous: 1.0.0+5
Current:  1.0.1+6
Result:   No change needed
```

### Scenario 2: Same Version (Auto-increment)
```
Previous: 1.0.0+5
Current:  1.0.0+5
Result:   Updated to 1.0.1+6
```

### Scenario 3: Lower Version (Auto-increment)
```
Previous: 1.0.5+10
Current:  1.0.3+8
Result:   Updated to 1.0.6+11
```

## Local Development

### Setup

```bash
# Clone the repository
git clone https://github.com/Abdo-ka/flutter-version-checker.git
cd flutter-version-checker

# Install dependencies
npm install

# Run tests
npm test

# Build the action
npm run build
```

### Testing

The action includes comprehensive tests for version parsing, comparison, and increment logic:

```bash
npm test
```

## Requirements

- Node.js 20+
- Git repository with commit history
- `pubspec.yaml` file in repository root with version field
- GitHub token with repository write permissions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run `npm test` and `npm run build`
6. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

If you encounter issues or have questions:

1. Check the [GitHub Issues](https://github.com/Abdo-ka/flutter-version-checker/issues)
2. Create a new issue with detailed information
3. Include your workflow file and error messages
