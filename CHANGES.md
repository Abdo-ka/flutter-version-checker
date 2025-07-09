# Flutter Version Checker - Release History

## v1.0.2 (2025-07-09)

## What's Changed

### Commits since v1.0.1:
- Fix auto-release workflow git push issue (a4f4262)

## Features

## Bug Fixes
- Fix auto-release workflow git push issue

## Improvements

---
**Full Changelog**: https://github.com/Abdo-ka/flutter-version-checker/compare/v1.0.1...v1.0.2



## Latest Changes (v1.1.0)

### 1. Simplified Configuration
- **Removed `pubspec-path` parameter**: Action now always looks for `pubspec.yaml` in project root (standard Flutter structure)
- **Automatic Git Tagging**: Action now creates and pushes version tags automatically
- **Streamlined Inputs**: Only 3 required inputs: `branch`, `token`, and optional `commit-message`

### 2. Enhanced Git Integration
- **Automatic Tagging**: Creates tags with format `vX.Y.Z+BUILD` for each version increment
- **Professional Git Config**: Uses standard GitHub Action credentials
- **Tag Message Format**: `"Staging release vX.Y.Z+BUILD"`

### 3. Updated Usage Examples
All documentation now reflects simplified usage:
```yaml
uses: Abdo-ka/flutter-version-checker@v1
with:
  branch: ${{ github.ref_name }}
  token: ${{ secrets.GITHUB_TOKEN }}
```

##  Previous Changes (v1.0.0)

### 1. Repository Information Updated
- **GitHub Repository**: https://github.com/Abdo-ka/flutter-version-checker
- **Author**: Abd Alrahman Kanawati
- **Username**: Abdo-ka

### 2. Emoji Removal (Professional Appearance)
All emojis have been removed from:
- README.md documentation
- USAGE.md guide  
- Workflow files (.github/workflows/*.yml)
- Source code log messages (src/index.js)
- Action definition (action.yml)

### 3. Professional Language
- Changed from casual/emoji-heavy to professional tone
- Updated commit messages to be more formal
- Standardized step names across all workflows

### 4. Files Updated
- action.yml - Removed pubspec-path parameter
- src/index.js - Added automatic tagging, simplified path handling
- README.md - Updated documentation for simplified usage
- USAGE.md - Removed pubspec-path examples
- All workflow files - Updated to use simplified parameters

### 5. Key Improvements
**Before**: Required pubspec-path configuration  
**After**: Automatic detection in project root

**Before**: Manual tag creation in workflows  
**After**: Automatic tag creation and push

**Before**: Complex parameter setup  
**After**: Simple 2-parameter setup (branch + token)

## Ready for Production
The action is now simplified and ready for:
- Standard Flutter project structure (pubspec.yaml in root)
- Automatic version tagging for releases
- Enterprise/professional environments with minimal configuration
- Production CI/CD pipelines with streamlined setup

## Repository Structure
```
flutter-version-checker/
├── README.md (Simplified usage documentation)
├── USAGE.md (Updated usage guide)
├── package.json (Updated with repo info)
├── LICENSE (Copyright: Abd Alrahman Kanawati)
├── action.yml (Simplified inputs)
├── src/index.js (Enhanced with auto-tagging)
├── dist/ (Built action for GitHub)
└── .github/workflows/ (Updated examples)
```

## Simple Usage Example
```yaml
- name: Check and Auto-Increment Flutter Version
  uses: Abdo-ka/flutter-version-checker@v1
  with:
    branch: ${{ github.ref_name }}
    token: ${{ secrets.GITHUB_TOKEN }}
```

## Next Steps
1. Push to GitHub repository: https://github.com/Abdo-ka/flutter-version-checker
2. Create v1.1.0 release tag
3. Test automatic tagging in real Flutter projects
4. Consider GitHub Marketplace publication
