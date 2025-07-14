#!/usr/bin/env node

const fs = require('fs');
const yaml = require('js-yaml');
const { execSync } = require('child_process');

/**
 * Parse a Flutter version string (e.g., "1.0.1+2")
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
 * Generate next version by incrementing patch and build number
 * @param {string} currentVersion - The current version
 * @param {string} [previousVersion] - The previous version to compare against
 * @returns {string} - The next version
 */
function incrementVersion(currentVersion, previousVersion = null) {
  const parsed = parseFlutterVersion(currentVersion);
  if (!parsed) return '1.0.0+1';
  
  // If we have a previous version, compare to determine increment strategy
  if (previousVersion) {
    const prevParsed = parseFlutterVersion(previousVersion);
    if (prevParsed) {
      // If patch version has already been incremented, only increment build number
      if (parsed.patch > prevParsed.patch || 
          parsed.minor > prevParsed.minor || 
          parsed.major > prevParsed.major) {
        const newBuild = parsed.build + 1;
        return `${parsed.major}.${parsed.minor}.${parsed.patch}+${newBuild}`;
      }
    }
  }
  
  // Default behavior: increment patch version and build number
  const newPatch = parsed.patch + 1;
  const newBuild = parsed.build + 1;
  
  return `${parsed.major}.${parsed.minor}.${newPatch}+${newBuild}`;
}

/**
 * Get the current version from pubspec.yaml
 * @param {string} pubspecPath - Path to pubspec.yaml
 * @returns {string|null} - Current version or null
 */
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
 * Get the previous version from git history
 * @param {string} pubspecPath - Path to pubspec.yaml
 * @returns {string|null} - Previous version or null
 */
function getPreviousVersion(pubspecPath) {
  try {
    // Get the previous version of pubspec.yaml from git
    const gitShow = execCommand('git show HEAD~1:pubspec.yaml');
    if (!gitShow) return null;
    
    const doc = yaml.load(gitShow);
    return doc.version || null;
  } catch (error) {
    console.log('⚠️  Could not retrieve previous version from git history');
    return null;
  }
}
function execCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.message);
    return '';
  }
}

/**
 * Configure git for committing (without token - uses existing auth)
 */
function configureGit() {
  try {
    // Check if git is configured
    const userName = execCommand('git config user.name');
    const userEmail = execCommand('git config user.email');
    
    if (!userName || !userEmail) {
      console.log('Configuring git user...');
      execSync('git config user.name "Version Auto-Increment"');
      execSync('git config user.email "auto-increment@local"');
    }
    
    console.log('Git configuration ready');
  } catch (error) {
    console.error(`Failed to configure git: ${error.message}`);
    throw error;
  }
}

/**
 * Main function to auto-increment version
 */
function main() {
  const pubspecPath = 'pubspec.yaml';
  
  console.log('🚀 Flutter Version Auto-Increment Script');
  console.log('=========================================');
  
  // Check if running in GitHub Actions
  const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
  
  // Check if pubspec.yaml exists
  if (!fs.existsSync(pubspecPath)) {
    console.error(`❌ pubspec.yaml not found at ${pubspecPath}`);
    process.exit(1);
  }
  
  // Get current version
  const currentVersion = getCurrentVersion(pubspecPath);
  if (!currentVersion) {
    console.error('❌ Could not read version from pubspec.yaml');
    process.exit(1);
  }
  
  console.log(`📦 Current version: ${currentVersion}`);
  
  // Get previous version from git history
  const previousVersion = getPreviousVersion(pubspecPath);
  if (previousVersion) {
    console.log(`📜 Previous version: ${previousVersion}`);
  }
  
  // Generate new version
  const newVersion = incrementVersion(currentVersion, previousVersion);
  console.log(`📈 New version: ${newVersion}`);
  
  // Update pubspec.yaml
  if (!updatePubspecVersion(pubspecPath, newVersion)) {
    console.error('❌ Failed to update pubspec.yaml');
    process.exit(1);
  }
  
  console.log(`✅ Updated pubspec.yaml with version: ${newVersion}`);
  
  // If running in GitHub Actions, skip git operations (workflow handles them)
  if (isGitHubActions) {
    console.log('🤖 Running in GitHub Actions - skipping git operations');
    console.log('   Git operations will be handled by the workflow');
    return;
  }
  
  // Configure git for local execution
  configureGit();
  
  // Check if there are changes to commit
  const status = execCommand('git status --porcelain');
  if (!status) {
    console.log('ℹ️  No changes to commit');
    return;
  }
  
  // Commit changes
  const commitMessage = `Auto-increment version to ${newVersion}

Previous version: ${currentVersion}
New version: ${newVersion}
Auto-generated by version increment script`;

  try {
    console.log('📝 Staging changes...');
    execSync('git add pubspec.yaml');
    
    console.log('💾 Committing changes...');
    execSync(`git commit -m "${commitMessage}"`);
    
    // Create tag
    const tagName = `v${newVersion}`;
    console.log(`🏷️  Creating tag ${tagName}...`);
    execSync(`git tag -a ${tagName} -m "Release ${tagName}"`);
    
    // Push changes (this will use your existing git authentication)
    console.log('🚀 Pushing changes...');
    execSync('git push');
    
    console.log('🚀 Pushing tag...');
    execSync(`git push origin ${tagName}`);
    
    console.log('🎉 Version successfully incremented and pushed!');
    console.log(`📦 New version: ${newVersion}`);
    console.log(`🏷️  Tag created: ${tagName}`);
    
  } catch (error) {
    console.error('❌ Failed to commit and push changes:');
    console.error(error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, incrementVersion, parseFlutterVersion };
