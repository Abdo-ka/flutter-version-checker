#!/usr/bin/env node

// Demo script to show what the auto-increment would do
const fs = require('fs');
const yaml = require('js-yaml');

function parseFlutterVersion(versionStr) {
  if (!versionStr) return null;
  
  const parts = versionStr.split('+');
  const baseParts = parts[0].split('.');
  const buildNumber = parts[1] ? parseInt(parts[1], 10) : 0;
  
  return {
    major: parseInt(baseParts[0], 10) || 0,
    minor: parseInt(baseParts[1], 10) || 0,
    patch: parseInt(baseParts[2], 10) || 0,
    build: buildNumber,
    base: parts[0],
    full: versionStr
  };
}

function incrementVersion(currentVersion) {
  const parsed = parseFlutterVersion(currentVersion);
  if (!parsed) return '1.0.0+1';
  
  const newPatch = parsed.patch + 1;
  const newBuild = parsed.build + 1;
  
  return `${parsed.major}.${parsed.minor}.${newPatch}+${newBuild}`;
}

function getCurrentVersion(pubspecPath) {
  try {
    const content = fs.readFileSync(pubspecPath, 'utf8');
    const doc = yaml.load(content);
    return doc.version || null;
  } catch (error) {
    console.error(`Error reading pubspec.yaml: ${error.message}`);
    return null;
  }
}

// Demo execution
function demo() {
  const pubspecPath = 'pubspec.yaml';
  
  console.log('🎯 AUTO-INCREMENT DEMO (READ-ONLY)');
  console.log('==================================');
  
  if (!fs.existsSync(pubspecPath)) {
    console.error(`❌ pubspec.yaml not found at ${pubspecPath}`);
    return;
  }
  
  const currentVersion = getCurrentVersion(pubspecPath);
  if (!currentVersion) {
    console.error('❌ Could not read version from pubspec.yaml');
    return;
  }
  
  const newVersion = incrementVersion(currentVersion);
  
  console.log(`📦 Current version: ${currentVersion}`);
  console.log(`📈 Would increment to: ${newVersion}`);
  console.log(`🏷️  Would create tag: v${newVersion}`);
  console.log('');
  console.log('🎯 Actions that would be performed:');
  console.log('   1. Update pubspec.yaml version');
  console.log('   2. Stage pubspec.yaml changes');
  console.log('   3. Commit with descriptive message');
  console.log('   4. Create version tag');
  console.log('   5. Push changes and tag');
  console.log('');
  console.log('💡 To actually run the increment:');
  console.log('   npm run version:increment');
  console.log('   OR');
  console.log('   node scripts/auto-increment-version.js');
}

demo();
