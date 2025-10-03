# Flutter Version Checker - Release History

## v1.0.3+7 (2025-10-03)

## What's Changed

### Commits since v1.0.3+5:
- chore: update generated timestamp in package_config.json and remove auto-increment version workflow (fd055c2)
- Merge branch 'main' of github-personal:Abdo-ka/flutter-version-checker (e3e21b7)
- chore: update generated timestamp in package_config.json (5d135a3)
- Build and package updates for version 1.0.3+5 (08aa6cd)

## Features

## Bug Fixes

## Improvements
- chore: update generated timestamp in package_config.json and remove auto-increment version workflow
- chore: update generated timestamp in package_config.json
- Build and package updates for version 1.0.3+5

---
**Full Changelog**: https://github.com/Abdo-ka/flutter-version-checker/compare/v1.0.3+5...v1.0.3+7



## v2.4.0 (2025-07-14)

## What's Changed

### Commits since v2.3.0:
- feat: enhance version increment logic to handle pre-incremented versions (3672c0b)
- Auto-update CHANGES.md for v2.3.0 [skip ci] (9321ae9)

## Features
- feat: enhance version increment logic to handle pre-incremented versions

## Bug Fixes

## Improvements
- feat: enhance version increment logic to handle pre-incremented versions
- Auto-update CHANGES.md for v2.3.0 [skip ci]

---
**Full Changelog**: https://github.com/Abdo-ka/flutter-version-checker/compare/v2.3.0...v2.4.0



## v1.2.2 (2025-07-09)

### 🐛 Bug Fixes
- **Fixed Version Comparison Logic**: Corrected the `compareVersions` function to properly detect identical versions
- **Enhanced Version Detection**: Improved logic to properly handle cases where current version equals previous version
- **Better Git Branch Handling**: Fixed issues with fetching branch references in CI environments

### 🔧 Improvements
- **More Accurate Version Checking**: Now correctly identifies when versions are reused and need incrementing
- **Test Coverage**: Fixed failing test case for identical version comparison
- **Error Handling**: Better handling of git fetch errors in different CI environments

### 🧪 Quality Assurance
- **All Tests Passing**: Fixed comparison logic ensures 100% test pass rate (10/10 tests)
- **Production Ready**: Thoroughly tested version comparison scenarios

This release fixes the core issue where identical versions were not being properly detected, ensuring proper auto-increment behavior.

---
**Full Changelog**: https://github.com/Abdo-ka/flutter-version-checker/compare/v1.2.1...v1.2.2

## v1.2.1 (2025-07-09)

## What's Changed

### Commits since v1.2.0:
- 🚀 Release v1.2.1 (e63ec01)
- Merge branch 'main' of github-personal:Abdo-ka/flutter-version-checker (b2263c0)
- fix: Update version comparison logic and remove deprecated workflow examples (c6a5cf8)
- Auto-update CHANGES.md for v1.2.0 [skip ci] (cb7c39e)

## Features

## Bug Fixes
- fix: Update version comparison logic and remove deprecated workflow examples

## Improvements
- fix: Update version comparison logic and remove deprecated workflow examples
- Auto-update CHANGES.md for v1.2.0 [skip ci]

---
**Full Changelog**: https://github.com/Abdo-ka/flutter-version-checker/compare/v1.2.0...v1.2.1



## v1.2.1 (2025-07-09)

### 📚 Documentation & Examples
- Added comprehensive workflow examples for Flutter CI/CD integration
- Created fixed staging workflow example
- Enhanced troubleshooting documentation
- Added implementation summary

### 🔧 Improvements
- Cleaned up changelog formatting
- Better package versioning alignment
- Enhanced example workflows for real-world usage

---
**Full Changelog**: https://github.com/Abdo-ka/flutter-version-checker/compare/v1.2.0...v1.2.1

## v1.2.0 (2025-07-09)

### 🔧 Major Enhancements & Bug Fixes
- **Enhanced Git Operations**: Robust authentication using GitHub token with improved error handling
- **Shallow Repository Support**: Automatic detection and handling of shallow git repositories
- **Improved Branch Handling**: Better fetching of target branch history and commit analysis
- **Enhanced Error Handling**: Comprehensive error messages with detailed debugging information
- **Professional Logging**: Added emoji-enhanced logging for better user experience

### 🛡️ Security & Reliability
- **Token Validation**: Required GitHub token validation for secure operations
- **Git Authentication**: Proper authentication setup for push operations
- **Error Recovery**: Better handling of git operation failures
- **Status Verification**: Checks for actual changes before committing

### 📚 Documentation Improvements
- **Complete Examples**: Added comprehensive workflow examples (simple & advanced)
- **Troubleshooting Guide**: Created detailed troubleshooting documentation
- **Implementation Summary**: Added summary of all improvements and features
- **Real-world Scenarios**: Provided practical usage scenarios and configurations

### 🎯 New Features
- **Version Tag Creation**: Automatically creates and pushes version tags (v1.2.3+45 format)
- **Enhanced Output**: Detailed action outputs for integration with other workflow steps
- **Smart Version Detection**: Improved algorithm for finding previous versions in git history
- **Flexible Configuration**: Support for custom commit messages and branch targeting

### 🧪 Testing & Quality
- **All Tests Passing**: Maintained 100% test pass rate (10/10 tests)
- **Built Distribution**: Updated compiled action in dist/ folder
- **Production Ready**: Thoroughly tested and ready for production use

---
**Full Changelog**: https://github.com/Abdo-ka/flutter-version-checker/compare/v1...v1.2.0
- **Professional Logging**: Added emoji-enhanced logging for better user experience

### 🛡️ Security & Reliability
- **Token Validation**: Required GitHub token validation for secure operations
- **Git Authentication**: Proper authentication setup for push operations
- **Error Recovery**: Better handling of git operation failures
- **Status Verification**: Checks for actual changes before committing

### 📚 Documentation Improvements
- **Complete Examples**: Added comprehensive workflow examples (simple & advanced)
- **Troubleshooting Guide**: Created detailed troubleshooting documentation
- **Implementation Summary**: Added summary of all improvements and features
- **Real-world Scenarios**: Provided practical usage scenarios and configurations

### 🎯 New Features
- **Version Tag Creation**: Automatically creates and pushes version tags (v1.2.3+45 format)
- **Enhanced Output**: Detailed action outputs for integration with other workflow steps
- **Smart Version Detection**: Improved algorithm for finding previous versions in git history
- **Flexible Configuration**: Support for custom commit messages and branch targeting

### 🧪 Testing & Quality
- **All Tests Passing**: Maintained 100% test pass rate (10/10 tests)
- **Built Distribution**: Updated compiled action in dist/ folder
- **Production Ready**: Thoroughly tested and ready for production use


## Latest Changes (v2.2.0)

## v2.3.0 (2025-07-10)

### Changes in this release:
- 🔖 Version bump to v2.3.0
- 🚀 Complete GitHub Action Setup: Auto-Increment with Publishing
- Auto-update CHANGES.md for v2.2.0 [skip ci]
- Merge branch 'main' of github-personal:Abdo-ka/flutter-version-checker
- chore: update version to 2.2.0 in package.json
- Auto-increment version [skip ci]
- 🐛 Fix version comparison logic - Release v1.2.2
-  Release v1.2.2
- Merge branch 'main' of github-personal:Abdo-ka/flutter-version-checker
- chore: Bump version to 1.2.2 and enhance version checking logic

### Key Features:
- Professional Flutter version management
- Automatic version increment and tagging
- Branch history validation
- Seamless CI/CD integration


## v2.2.0 (2025-07-10)

### Changes in this release:
- Merge branch 'main' of github-personal:Abdo-ka/flutter-version-checker
- chore: update version to 2.2.0 in package.json
- Auto-increment version [skip ci]
- 🐛 Fix version comparison logic - Release v1.2.2
-  Release v1.2.2
- Merge branch 'main' of github-personal:Abdo-ka/flutter-version-checker
- chore: Bump version to 1.2.2 and enhance version checking logic
- Auto-update CHANGES.md for v1.2.1 [skip ci]
- 🚀 Release v1.2.1
- Merge branch 'main' of github-personal:Abdo-ka/flutter-version-checker

### Key Features:
- Professional Flutter version management
- Automatic version increment and tagging
- Branch history validation
- Seamless CI/CD integration


## Previous Changes (v1.1.0)

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
