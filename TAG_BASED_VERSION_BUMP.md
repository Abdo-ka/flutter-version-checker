# Tag-Based Version Bump Tool

A comprehensive tool for managing Flutter app versions based on git tags and pubspec.yaml. This tool intelligently compares your current version with the latest git tag and bumps the version accordingly.

## Features

- 🏷️ **Tag-Aware**: Compares current version with latest git tag
- 🤖 **Smart Bumping**: Auto-determines appropriate version bump type
- 🔧 **Multiple Bump Types**: Support for major, minor, patch, and build number increments
- 🔍 **Dry Run Mode**: Preview changes before applying them
- 📦 **Auto-Tagging**: Optionally create and push git tags
- ✅ **Validation**: Verifies version changes and provides clear feedback

## Installation

The scripts are already included in your project. Make sure you have Node.js installed and the required dependencies:

```bash
npm install js-yaml semver
```

## Usage

### Using the Shell Wrapper (Recommended)

```bash
# Show help
./scripts/bump-version.sh --help

# Dry run to see what would happen
./scripts/bump-version.sh --dry-run

# Auto-bump version (build number increment)
./scripts/bump-version.sh

# Bump patch version
./scripts/bump-version.sh --bump-type patch

# Bump minor version and create tag
./scripts/bump-version.sh --bump-type minor --create-tag

# Force version bump even if current version is ahead
./scripts/bump-version.sh --force --bump-type patch
```

### Using Node.js Directly

```bash
# Auto-bump (recommended)
node scripts/tag-based-version-bump.js

# Dry run
node scripts/tag-based-version-bump.js --dry-run

# Specific bump types
node scripts/tag-based-version-bump.js --bump-type patch
node scripts/tag-based-version-bump.js --bump-type minor
node scripts/tag-based-version-bump.js --bump-type major

# Create tag after version bump
node scripts/tag-based-version-bump.js --bump-type patch --create-tag
```

## Command Line Options

| Option | Short | Description |
|--------|-------|-------------|
| `--bump-type <type>` | `-t` | Version bump type: `major`, `minor`, `patch`, `build`, `auto` (default: `auto`) |
| `--dry-run` | `-d` | Show what would be done without making changes |
| `--create-tag` | `-c` | Create and push a git tag after bumping version |
| `--force` | `-f` | Force version bump even if current version is ahead of latest tag |
| `--help` | `-h` | Show help message |

## Version Bump Types

### Auto Mode (Default)
- Compares current pubspec.yaml version with latest git tag
- If versions match: bumps build number (`1.0.3+5` → `1.0.3+6`)
- If current is behind tag: bumps patch version from tag
- If current is ahead: suggests creating a tag

### Manual Bump Types
- **build**: `1.0.3+5` → `1.0.3+6` (increment build number only)
- **patch**: `1.0.3+5` → `1.0.4+1` (increment patch, reset build to 1)
- **minor**: `1.0.3+5` → `1.1.0+1` (increment minor, reset patch and build)
- **major**: `1.0.3+5` → `2.0.0+1` (increment major, reset minor, patch, and build)

## How It Works

1. **Read Current State**: Gets version from `pubspec.yaml` and latest git tag
2. **Compare Versions**: Uses semantic versioning logic to compare versions
3. **Determine Action**: Decides appropriate bump type based on comparison
4. **Update Version**: Modifies `pubspec.yaml` with new version
5. **Create Tag** (optional): Creates and pushes git tag for new version

## Examples

### Scenario 1: Version matches latest tag
```bash
Current pubspec.yaml: 1.0.3+5
Latest git tag: v1.0.3+5
Action: Build number increment → 1.0.3+6
```

### Scenario 2: Version is behind latest tag
```bash
Current pubspec.yaml: 1.0.2+3
Latest git tag: v1.0.3+5
Action: Patch increment from tag → 1.0.4+1
```

### Scenario 3: Version is ahead of latest tag
```bash
Current pubspec.yaml: 1.0.4+1
Latest git tag: v1.0.3+5
Action: Suggest creating tag for current version
```

### Scenario 4: No tags exist
```bash
Current pubspec.yaml: 1.0.0+1
Latest git tag: (none)
Action: Use --force to proceed or create first tag manually
```

## Integration with CI/CD

You can integrate this tool into your GitHub Actions workflow:

```yaml
- name: Bump version based on tags
  run: |
    ./scripts/bump-version.sh --bump-type auto --create-tag
    
- name: Get new version
  id: version
  run: |
    VERSION=$(grep '^version:' pubspec.yaml | sed 's/version: //')
    echo "version=$VERSION" >> $GITHUB_OUTPUT
```

## Error Handling

The script includes comprehensive error handling:
- ✅ Validates git repository
- ✅ Checks for pubspec.yaml existence
- ✅ Verifies Node.js availability
- ✅ Validates version format
- ✅ Confirms file write operations

## Tips

1. **Always dry-run first**: Use `--dry-run` to preview changes
2. **Use auto mode**: Let the script determine the best bump type
3. **Create tags**: Use `--create-tag` to maintain version history
4. **Force when needed**: Use `--force` for special cases
5. **Semantic versioning**: Follow semantic versioning principles

## Troubleshooting

### "No tags found"
- Create your first tag manually: `git tag -a v1.0.0 -m "Initial release"`
- Or use `--force` to proceed without existing tags

### "Version verification failed"
- Check file permissions on pubspec.yaml
- Ensure YAML syntax is valid

### "Not in a git repository"
- Run the script from your Flutter project root
- Ensure the directory is a git repository

## Related Files

- `scripts/tag-based-version-bump.js` - Main Node.js script
- `scripts/bump-version.sh` - Shell wrapper for easier usage
- `src/index.js` - GitHub Actions version checker (more comprehensive)
- `pubspec.yaml` - Flutter project configuration with version

## Contributing

Feel free to enhance the tool by:
- Adding new bump strategies
- Improving error messages
- Adding more validation
- Supporting additional version formats