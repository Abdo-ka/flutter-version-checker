# Example GitHub Action Usage

This directory contains example workflows showing how to use the Flutter Version Checker & Auto-Increment Action.

## Basic Flutter CI/CD with Auto-Increment

```yaml
name: Flutter CI/CD with Auto-Increment

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

permissions:
  contents: write  # Required for auto-increment to push changes

jobs:
  auto-increment:
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.version-check.outputs.current-version }}
      version-updated: ${{ steps.version-check.outputs.version-updated }}
    
    steps:
    - name: Checkout Repository
      uses: actions/checkout@v4
      with:
        fetch-depth: 0  # Required for version history comparison
        token: ${{ github.token }}
    
    - name: Auto-Increment Flutter Version
      id: version-check
      uses: Abdo-ka/flutter-version-checker@v1
      with:
        branch: ${{ github.ref_name }}
        token: ${{ github.token }}
        commit-message: "🚀 Auto-increment version to %NEW_VERSION% [skip ci]"
    
    - name: Show Version Info
      run: |
        echo "Previous version: ${{ steps.version-check.outputs.previous-version }}"
        echo "Current version: ${{ steps.version-check.outputs.current-version }}"
        echo "Version updated: ${{ steps.version-check.outputs.version-updated }}"
        echo "New version: ${{ steps.version-check.outputs.new-version }}"

  build-and-test:
    needs: auto-increment
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout Repository
      uses: actions/checkout@v4
      with:
        ref: ${{ github.ref }}  # Get the latest changes including auto-increment
    
    - name: Setup Flutter
      uses: subosito/flutter-action@v2
      with:
        flutter-version: '3.19.0'
        channel: 'stable'
    
    - name: Install Dependencies
      run: flutter pub get
    
    - name: Run Tests
      run: flutter test
    
    - name: Build APK
      run: flutter build apk --release
    
    - name: Build iOS
      if: runner.os == 'macOS'
      run: flutter build ios --release --no-codesign
    
    - name: Upload APK Artifact
      uses: actions/upload-artifact@v4
      with:
        name: flutter-apk-v${{ needs.auto-increment.outputs.version }}
        path: build/app/outputs/flutter-apk/app-release.apk

  release:
    needs: [auto-increment, build-and-test]
    runs-on: ubuntu-latest
    if: needs.auto-increment.outputs.version-updated == 'true' && github.ref == 'refs/heads/main'
    
    steps:
    - name: Checkout Repository
      uses: actions/checkout@v4
      with:
        ref: ${{ github.ref }}
    
    - name: Download APK
      uses: actions/download-artifact@v4
      with:
        name: flutter-apk-v${{ needs.auto-increment.outputs.version }}
        path: ./artifacts
    
    - name: Create Release
      uses: actions/create-release@v1
      env:
        GITHUB_TOKEN: ${{ github.token }}
      with:
        tag_name: v${{ needs.auto-increment.outputs.version }}
        release_name: Flutter App v${{ needs.auto-increment.outputs.version }}
        body: |
          ## 🚀 Release v${{ needs.auto-increment.outputs.version }}
          
          Auto-generated release with version increment.
          
          ### Changes
          - Version updated from ${{ needs.auto-increment.outputs.previous-version }} to ${{ needs.auto-increment.outputs.version }}
          
          ### Downloads
          - APK: See assets below
        draft: false
        prerelease: false
```

## Simple Auto-Increment Only

```yaml
name: Auto-Increment Version Only

on:
  push:
    branches: [ main ]

permissions:
  contents: write

jobs:
  increment:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
        token: ${{ github.token }}
    
    - name: Auto-Increment Version
      uses: Abdo-ka/flutter-version-checker@v1
      with:
        branch: main
        token: ${{ github.token }}
```

## Multiple Branch Strategy

```yaml
name: Multi-Branch Version Management

on:
  push:
    branches: [ main, develop, 'release/*' ]

permissions:
  contents: write

jobs:
  version-management:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
        token: ${{ github.token }}
    
    - name: Auto-Increment for Main
      if: github.ref == 'refs/heads/main'
      uses: Abdo-ka/flutter-version-checker@v1
      with:
        branch: main
        token: ${{ github.token }}
        commit-message: "🚀 Production version increment to %NEW_VERSION%"
    
    - name: Auto-Increment for Develop
      if: github.ref == 'refs/heads/develop'
      uses: Abdo-ka/flutter-version-checker@v1
      with:
        branch: develop
        token: ${{ github.token }}
        commit-message: "🧪 Development version increment to %NEW_VERSION%"
    
    - name: Auto-Increment for Release Branches
      if: startsWith(github.ref, 'refs/heads/release/')
      uses: Abdo-ka/flutter-version-checker@v1
      with:
        branch: ${{ github.ref_name }}
        token: ${{ github.token }}
        commit-message: "🎯 Release candidate version increment to %NEW_VERSION%"
```

## With Custom Conditions

```yaml
name: Conditional Auto-Increment

on:
  push:
    branches: [ main ]

permissions:
  contents: write

jobs:
  conditional-increment:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
        token: ${{ github.token }}
    
    - name: Check if version increment needed
      id: check
      run: |
        # Only increment if commit message doesn't contain [skip-increment]
        if [[ "${{ github.event.head_commit.message }}" == *"[skip-increment]"* ]]; then
          echo "skip_increment=true" >> $GITHUB_OUTPUT
        else
          echo "skip_increment=false" >> $GITHUB_OUTPUT
        fi
    
    - name: Auto-Increment Version
      if: steps.check.outputs.skip_increment == 'false'
      uses: Abdo-ka/flutter-version-checker@v1
      with:
        branch: main
        token: ${{ github.token }}
        commit-message: "🚀 Auto-increment version to %NEW_VERSION% [skip ci]"
```

## Integration with Flutter Build

```yaml
name: Flutter Build with Version Check

on:
  push:
    branches: [ main ]

permissions:
  contents: write

jobs:
  version-and-build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
        token: ${{ github.token }}
    
    - name: Auto-Increment Version
      id: version
      uses: Abdo-ka/flutter-version-checker@v1
      with:
        branch: main
        token: ${{ github.token }}
    
    - name: Setup Flutter
      uses: subosito/flutter-action@v2
      with:
        flutter-version: 'stable'
    
    - name: Get Dependencies
      run: flutter pub get
    
    - name: Build with New Version
      run: |
        echo "Building with version: ${{ steps.version.outputs.current-version }}"
        flutter build apk --build-name=${{ steps.version.outputs.current-version }}
    
    - name: Upload Build
      uses: actions/upload-artifact@v4
      with:
        name: flutter-build-${{ steps.version.outputs.current-version }}
        path: build/app/outputs/flutter-apk/
```
