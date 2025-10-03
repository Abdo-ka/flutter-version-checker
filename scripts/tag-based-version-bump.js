#!/usr/bin/env node

const fs = require('fs');
const yaml = require('js-yaml');
const { execSync } = require('child_process');
const semver = require('semver');

/**
 * Parse a Flutter version string (e.g., "1.0.3+5")
 * @param {string} versionStr - The version string
 * @returns {object} - Parsed version object
 */
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

/**
 * Compare two Flutter versions
 * @param {string} current - Current version
 * @param {string} previous - Previous version
 * @returns {number} - 1 if current > previous, 0 if equal, -1 if current < previous
 */
function compareVersions(current, previous) {
  const currentParsed = parseFlutterVersion(current);
  const previousParsed = parseFlutterVersion(previous);
  
  if (!currentParsed || !previousParsed) return 0;
  
  // Compare base version using semver
  const baseComparison = semver.compare(currentParsed.base, previousParsed.base);
  
  if (baseComparison !== 0) {
    return baseComparison;
  }
  
  // Same base version, compare build numbers
  if (currentParsed.build > previousParsed.build) return 1;
  if (currentParsed.build < previousParsed.build) return -1;
  return 0;
}

/**
 * Get the latest git tag
 * @returns {string|null} - Latest tag or null if no tags exist
 */
function getLatestTag() {
  try {
    const output = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' });
    return output.trim();
  } catch (error) {
    console.warn('No tags found or git error:', error.message);
    return null;
  }
}

/**
 * Get all tags sorted by version
 * @returns {string[]} - Array of tags sorted by version (latest first)
 */
function getAllTagsSorted() {
  try {
    const output = execSync('git tag --list', { encoding: 'utf8' });
    const tags = output.trim().split('\n').filter(tag => tag.trim());
    
    // Sort tags by version (descending)
    return tags.sort((a, b) => {
      const versionA = a.replace(/^v/, '');
      const versionB = b.replace(/^v/, '');
      return compareVersions(versionB, versionA);
    });
  } catch (error) {
    console.warn('Error getting tags:', error.message);
    return [];
  }
}

/**
 * Get the current version from pubspec.yaml
 * @param {string} pubspecPath - Path to pubspec.yaml
 * @returns {string|null} - Current version or null
 */
function getCurrentVersion(pubspecPath = 'pubspec.yaml') {
  try {
    const content = fs.readFileSync(pubspecPath, 'utf8');
    const doc = yaml.load(content);
    return doc.version || null;
  } catch (error) {
    console.error(`Error reading pubspec.yaml: ${error.message}`);
    return null;
  }
}

/**
 * Update the version in pubspec.yaml
 * @param {string} pubspecPath - Path to pubspec.yaml
 * @param {string} newVersion - New version string
 * @returns {boolean} - Success status
 */
function updatePubspecVersion(pubspecPath, newVersion) {
  try {
    const content = fs.readFileSync(pubspecPath, 'utf8');
    const doc = yaml.load(content);
    doc.version = newVersion;
    
    const newContent = yaml.dump(doc, { 
      lineWidth: -1,
      noRefs: true,
      quotingType: '"',
      forceQuotes: false
    });
    
    fs.writeFileSync(pubspecPath, newContent, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error updating pubspec.yaml: ${error.message}`);
    return false;
  }
}

/**
 * Generate next version based on bump type
 * @param {string} currentVersion - The current version
 * @param {string} bumpType - Type of bump (major, minor, patch, build)
 * @returns {string} - The next version
 */
function generateNextVersion(currentVersion, bumpType = 'patch') {
  const parsed = parseFlutterVersion(currentVersion);
  if (!parsed) return '1.0.0+1';
  
  let newMajor = parsed.major;
  let newMinor = parsed.minor;
  let newPatch = parsed.patch;
  let newBuild = parsed.build + 1;
  
  switch (bumpType.toLowerCase()) {
    case 'major':
      newMajor += 1;
      newMinor = 0;
      newPatch = 0;
      newBuild = 1;
      break;
    case 'minor':
      newMinor += 1;
      newPatch = 0;
      newBuild = 1;
      break;
    case 'patch':
      newPatch += 1;
      newBuild = 1;
      break;
    case 'build':
      // Only increment build number
      break;
    default:
      // Default to patch increment
      newPatch += 1;
      newBuild = 1;
      break;
  }
  
  return `${newMajor}.${newMinor}.${newPatch}+${newBuild}`;
}

/**
 * Determine bump type based on version comparison
 * @param {string} currentVersion - Current version in pubspec.yaml
 * @param {string} latestTagVersion - Latest tag version
 * @returns {string} - Recommended bump type
 */
function determineBumpType(currentVersion, latestTagVersion) {
  const current = parseFlutterVersion(currentVersion);
  const latest = parseFlutterVersion(latestTagVersion);
  
  if (!current || !latest) return 'patch';
  
  // If versions are identical, increment build number
  if (current.major === latest.major && 
      current.minor === latest.minor && 
      current.patch === latest.patch) {
    return 'build';
  }
  
  // If current is ahead of latest tag, just increment build
  const comparison = compareVersions(currentVersion, latestTagVersion);
  if (comparison > 0) {
    return 'build';
  }
  
  // If current is behind latest tag, we need to increment from latest tag
  return 'patch';
}

/**
 * Create and push a new tag
 * @param {string} version - Version to tag
 * @param {string} message - Tag message
 */
function createAndPushTag(version, message = null) {
  try {
    const tagName = `v${version}`;
    const tagMessage = message || `Release ${tagName}`;
    
    console.log(`Creating tag: ${tagName}`);
    execSync(`git tag -a ${tagName} -m "${tagMessage}"`, { stdio: 'inherit' });
    
    console.log(`Pushing tag: ${tagName}`);
    execSync(`git push origin ${tagName}`, { stdio: 'inherit' });
    
    return true;
  } catch (error) {
    console.error(`Error creating/pushing tag: ${error.message}`);
    return false;
  }
}

/**
 * Main function to check and bump version
 */
function main() {
  const args = process.argv.slice(2);
  const options = {
    bumpType: 'auto',
    dryRun: false,
    createTag: false,
    force: false
  };
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--bump-type':
      case '-t':
        options.bumpType = args[i + 1];
        i++;
        break;
      case '--dry-run':
      case '-d':
        options.dryRun = true;
        break;
      case '--create-tag':
      case '-c':
        options.createTag = true;
        break;
      case '--force':
      case '-f':
        options.force = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: node tag-based-version-bump.js [options]

Options:
  -t, --bump-type <type>    Type of version bump (major, minor, patch, build, auto)
  -d, --dry-run            Show what would be done without making changes
  -c, --create-tag         Create and push a git tag after bumping version
  -f, --force              Force version bump even if current version is ahead
  -h, --help               Show this help message

Examples:
  node tag-based-version-bump.js --dry-run
  node tag-based-version-bump.js --bump-type patch --create-tag
  node tag-based-version-bump.js --force --bump-type major
        `);
        return;
    }
  }
  
  console.log('🚀 Flutter Tag-Based Version Bump Tool\n');
  
  // Get current version from pubspec.yaml
  const currentVersion = getCurrentVersion();
  if (!currentVersion) {
    console.error('❌ Could not read version from pubspec.yaml');
    process.exit(1);
  }
  
  console.log(`📦 Current version in pubspec.yaml: ${currentVersion}`);
  
  // Get latest tag
  const latestTag = getLatestTag();
  if (!latestTag) {
    console.log('📋 No tags found in repository');
    if (!options.force) {
      console.log('💡 Use --force to create initial version or create your first tag manually');
      return;
    }
  } else {
    const latestTagVersion = latestTag.replace(/^v/, '');
    console.log(`🏷️  Latest tag: ${latestTag} (version: ${latestTagVersion})`);
    
    // Compare versions
    const comparison = compareVersions(currentVersion, latestTagVersion);
    console.log(`🔍 Version comparison: ${currentVersion} vs ${latestTagVersion}`);
    
    if (comparison > 0) {
      console.log('✅ Current version is ahead of latest tag');
      if (!options.force && options.bumpType === 'auto') {
        console.log('💡 No version bump needed. Use --force to bump anyway or --create-tag to tag current version');
        if (options.createTag) {
          createAndPushTag(currentVersion, `Release v${currentVersion}`);
        }
        return;
      }
    } else if (comparison === 0) {
      console.log('⚠️  Current version matches latest tag');
    } else {
      console.log('❌ Current version is behind latest tag');
    }
  }
  
  // Determine bump type
  let bumpType = options.bumpType;
  if (bumpType === 'auto') {
    if (latestTag) {
      const latestTagVersion = latestTag.replace(/^v/, '');
      bumpType = determineBumpType(currentVersion, latestTagVersion);
      console.log(`🤖 Auto-determined bump type: ${bumpType}`);
    } else {
      bumpType = 'patch';
      console.log(`🤖 No tags found, defaulting to: ${bumpType}`);
    }
  }
  
  // Generate new version
  let baseVersion = currentVersion;
  if (latestTag && !options.force) {
    const latestTagVersion = latestTag.replace(/^v/, '');
    const comparison = compareVersions(currentVersion, latestTagVersion);
    if (comparison <= 0) {
      baseVersion = latestTagVersion;
      console.log(`📈 Using latest tag version as base: ${baseVersion}`);
    }
  }
  
  const newVersion = generateNextVersion(baseVersion, bumpType);
  console.log(`📈 Version bump: ${currentVersion} → ${newVersion} (${bumpType})`);
  
  if (options.dryRun) {
    console.log('\n🔍 DRY RUN - No changes will be made');
    console.log(`Would update pubspec.yaml version to: ${newVersion}`);
    if (options.createTag) {
      console.log(`Would create and push tag: v${newVersion}`);
    }
    return;
  }
  
  // Update pubspec.yaml
  console.log('\n📝 Updating pubspec.yaml...');
  if (!updatePubspecVersion('pubspec.yaml', newVersion)) {
    console.error('❌ Failed to update pubspec.yaml');
    process.exit(1);
  }
  
  // Verify the change
  const updatedVersion = getCurrentVersion();
  if (updatedVersion === newVersion) {
    console.log(`✅ Successfully updated pubspec.yaml to version: ${updatedVersion}`);
  } else {
    console.error(`❌ Version verification failed. Expected: ${newVersion}, Got: ${updatedVersion}`);
    process.exit(1);
  }
  
  // Create tag if requested
  if (options.createTag) {
    console.log('\n🏷️  Creating and pushing tag...');
    if (createAndPushTag(newVersion)) {
      console.log(`✅ Successfully created and pushed tag: v${newVersion}`);
    } else {
      console.error('❌ Failed to create/push tag');
      process.exit(1);
    }
  }
  
  console.log('\n🎉 Version bump completed successfully!');
  console.log(`📦 New version: ${newVersion}`);
  
  if (!options.createTag) {
    console.log('\n💡 To create a tag for this version, run:');
    console.log(`   git tag -a v${newVersion} -m "Release v${newVersion}"`);
    console.log(`   git push origin v${newVersion}`);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  parseFlutterVersion,
  compareVersions,
  generateNextVersion,
  getLatestTag,
  getCurrentVersion,
  updatePubspecVersion,
  determineBumpType
};