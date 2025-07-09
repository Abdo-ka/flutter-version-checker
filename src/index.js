const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const fs = require('fs');
const yaml = require('js-yaml');
const semver = require('semver');

/**
 * Parse a Flutter version string (e.g., "50.8.47+177")
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
  if (currentParsed.build <= previousParsed.build) return -1;
  return 0;
}

/**
 * Generate next version based on previous version
 * @param {string} previousVersion - The previous version
 * @returns {string} - The next version
 */
function generateNextVersion(previousVersion) {
  const parsed = parseFlutterVersion(previousVersion);
  if (!parsed) return '1.0.0+1';
  
  // Increment patch version and build number
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
    core.error(`Error reading pubspec.yaml: ${error.message}`);
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
    core.error(`Error updating pubspec.yaml: ${error.message}`);
    return false;
  }
}

/**
 * Execute git command and return output
 * @param {string[]} args - Git command arguments
 * @param {boolean} throwOnError - Whether to throw on error
 * @returns {string} - Command output
 */
async function execGit(args, throwOnError = false) {
  let output = '';
  let error = '';
  
  const options = {
    listeners: {
      stdout: (data) => {
        output += data.toString();
      },
      stderr: (data) => {
        error += data.toString();
      }
    },
    silent: true,
    ignoreReturnCode: !throwOnError
  };
  
  const exitCode = await exec.exec('git', args, options);
  
  if (exitCode !== 0) {
    const message = `Git command failed: git ${args.join(' ')}\nError: ${error}`;
    if (throwOnError) {
      throw new Error(message);
    }
    core.warning(message);
    return '';
  }
  
  return output.trim();
}

/**
 * Find previous version in branch history
 * @param {string} branch - Target branch name
 * @param {string} currentVersion - Current version to exclude
 * @returns {string|null} - Previous version or null
 */
async function findPreviousVersion(branch, currentVersion) {
  try {
    // First, ensure we have the latest changes from the remote branch
    core.info(`Fetching latest changes from origin/${branch}...`);
    
    // Try to unshallow if repository is shallow
    const isShallow = await execGit(['rev-parse', '--is-shallow-repository']);
    if (isShallow === 'true') {
      core.info('Repository is shallow, attempting to unshallow...');
      await execGit(['fetch', '--unshallow'], false);
    }
    
    // Fetch the target branch
    await execGit(['fetch', 'origin', `${branch}:${branch}`], false);
    
    core.info(`Searching for previous version in ${branch} branch history...`);
    
    // Get the commit history for the target branch
    const commitHashes = await execGit(['rev-list', `origin/${branch}`, '--max-count=100']);
    if (!commitHashes) {
      core.warning('No commit history found');
      return null;
    }
    
    const commits = commitHashes.split('\n').filter(hash => hash.trim());
    core.info(`Checking ${commits.length} commits for version history...`);
    
    let sameVersionCount = 0;
    let foundVersions = [];
    
    for (const commitHash of commits) {
      if (!commitHash.trim()) continue;
      
      try {
        // Get pubspec.yaml content from this commit
        const pubspecContent = await execGit(['show', `${commitHash}:pubspec.yaml`]);
        if (!pubspecContent) continue;
        
        const doc = yaml.load(pubspecContent);
        const commitVersion = doc.version;
        
        if (commitVersion) {
          foundVersions.push({
            version: commitVersion,
            commit: commitHash.substring(0, 8)
          });
          
          if (commitVersion === currentVersion) {
            sameVersionCount++;
            core.info(`Found same version: ${commitVersion} (commit ${commitHash.substring(0, 8)}) - Count: ${sameVersionCount}`);
          } else {
            // Found a different version
            core.info(`Found different version: ${commitVersion} (commit ${commitHash.substring(0, 8)})`);
            
            // If we found multiple commits with the same version, this indicates version reuse
            if (sameVersionCount > 1) {
              core.warning(`⚠️ Version ${currentVersion} was found in ${sameVersionCount} commits! This indicates version reuse.`);
              core.info(`📋 Returning current version as previous to force increment: ${currentVersion}`);
              return currentVersion; // This will trigger auto-increment
            }
            
            core.info(`Found previous version: ${commitVersion} (from commit ${commitHash.substring(0, 8)})`);
            return commitVersion;
          }
        }
      } catch (error) {
        // Skip invalid YAML or missing files
        continue;
      }
    }
    
    // If we only found the same version multiple times and no different version
    if (sameVersionCount > 1) {
      core.warning(`⚠️ Found ${sameVersionCount} commits with the same version ${currentVersion}!`);
      core.info(`📋 Version reuse detected. Returning current version to force increment.`);
      return currentVersion; // This will trigger auto-increment
    }
    
    // If we only found one instance of the current version, look for the last different version
    if (foundVersions.length > 0) {
      const lastDifferentVersion = foundVersions.find(v => v.version !== currentVersion);
      if (lastDifferentVersion) {
        core.info(`Found last different version: ${lastDifferentVersion.version} (commit ${lastDifferentVersion.commit})`);
        return lastDifferentVersion.version;
      }
    }
    
    core.info('No previous version found in commit history');
    return null;
  } catch (error) {
    core.warning(`Error finding previous version: ${error.message}`);
    return null;
  }
}

/**
 * Configure git for committing
 * @param {string} token - GitHub token for authentication
 */
async function configureGit(token) {
  try {
    // Configure git user
    await execGit(['config', '--local', 'user.email', 'action@github.com'], true);
    await execGit(['config', '--local', 'user.name', 'GitHub Action Auto-Fix'], true);
    
    // Configure authentication if token is provided
    if (token) {
      const remoteUrl = await execGit(['config', '--get', 'remote.origin.url']);
      if (remoteUrl) {
        // Extract repository info from URL
        const match = remoteUrl.match(/github\.com[\/:](.+?)(?:\.git)?$/);
        if (match) {
          const repo = match[1];
          const authenticatedUrl = `https://x-access-token:${token}@github.com/${repo}.git`;
          await execGit(['remote', 'set-url', 'origin', authenticatedUrl], true);
          core.info('Git authentication configured');
        }
      }
    }
  } catch (error) {
    core.warning(`Failed to configure git: ${error.message}`);
    throw error;
  }
}

/**
 * Commit and push version changes with tag
 * @param {string} branch - Target branch
 * @param {string} newVersion - New version
 * @param {string} previousVersion - Previous version
 * @param {string} customMessage - Custom commit message
 * @param {string} token - GitHub token
 */
async function commitAndPush(branch, newVersion, previousVersion, customMessage, token) {
  try {
    await configureGit(token);
    
    const commitMessage = customMessage || `Auto-increment version to ${newVersion}

Previous version: ${previousVersion}
New version: ${newVersion}
Auto-generated by GitHub Actions`;

    // Check if there are changes to commit
    const status = await execGit(['status', '--porcelain']);
    if (!status) {
      core.info('No changes to commit');
      return;
    }

    core.info('Staging pubspec.yaml changes...');
    await execGit(['add', 'pubspec.yaml'], true);
    
    core.info('Committing version update...');
    await execGit(['commit', '-m', commitMessage], true);
    
    // Create and push tag
    const tagName = `v${newVersion}`;
    core.info(`Creating tag ${tagName}...`);
    await execGit(['tag', '-a', tagName, '-m', `Release ${tagName}`], true);
    
    core.info(`Pushing changes to ${branch}...`);
    await execGit(['push', 'origin', `HEAD:${branch}`], true);
    
    core.info(`Pushing tag ${tagName}...`);
    await execGit(['push', 'origin', tagName], true);
    
    core.info('Successfully pushed version update and tag');
  } catch (error) {
    core.error(`Failed to commit and push: ${error.message}`);
    throw error;
  }
}

/**
 * Main action function
 */
async function run() {
  try {
    // Get inputs
    const branch = core.getInput('branch') || 'main';
    const token = core.getInput('token');
    const customMessage = core.getInput('commit-message');
    const pubspecPath = 'pubspec.yaml'; // Always in project root
    
    core.info(`🚀 Flutter Version Checker & Auto-Increment Action`);
    core.info(`📋 Checking version in ${pubspecPath} against ${branch} branch...`);
    
    // Validate required inputs
    if (!token) {
      core.setFailed('GitHub token is required. Please provide the token input.');
      return;
    }
    
    // Check if pubspec.yaml exists
    if (!fs.existsSync(pubspecPath)) {
      core.setFailed(`❌ pubspec.yaml not found at ${pubspecPath}`);
      return;
    }
    
    // Get current version
    const currentVersion = getCurrentVersion(pubspecPath);
    if (!currentVersion) {
      core.setFailed('❌ Could not read version from pubspec.yaml');
      return;
    }
    
    core.info(`📦 Current version in pubspec.yaml: ${currentVersion}`);
    
    // Find previous version in branch history
    const previousVersion = await findPreviousVersion(branch, currentVersion);
    
    // Set outputs
    core.setOutput('previous-version', previousVersion || 'none');
    core.setOutput('current-version', currentVersion);
    
    if (!previousVersion) {
      core.info('✅ Version check passed! No previous version found (first build).');
      core.setOutput('version-updated', 'false');
      return;
    }
    
    // Compare versions
    const comparison = compareVersions(currentVersion, previousVersion);
    
    core.info(`🔍 Comparing version numbers...`);
    core.info(`   📋 Current version: ${currentVersion}`);
    core.info(`   📋 Previous version: ${previousVersion}`);
    
    // Special case: if current version equals previous version, it indicates version reuse
    if (currentVersion === previousVersion) {
      core.warning(`⚠️  Version reuse detected! Version ${currentVersion} was already used in previous commits.`);
      core.info('🔧 Auto-fixing version number due to version reuse...');
      
      // Generate new version based on current version
      const newVersion = generateNextVersion(currentVersion);
      core.info(`📈 Auto-incrementing version: ${currentVersion} → ${newVersion}`);
      
      // Update pubspec.yaml
      if (!updatePubspecVersion(pubspecPath, newVersion)) {
        core.setFailed('❌ Failed to update pubspec.yaml');
        return;
      }
      
      // Verify the change
      const updatedVersion = getCurrentVersion(pubspecPath);
      core.info(`✅ Updated pubspec.yaml with version: ${updatedVersion}`);
      
      // Commit and push changes
      await commitAndPush(branch, newVersion, currentVersion, customMessage, token);
      
      core.info('🎉 Version has been auto-incremented due to reuse and committed.');
      core.info(`🚀 The workflow will now continue with the new version: ${newVersion}`);
      
      // Set outputs
      core.setOutput('version-updated', 'true');
      core.setOutput('new-version', newVersion);
      core.setOutput('current-version', newVersion);
      return;
    }
    
    if (comparison > 0) {
      core.info('✅ Version check passed! Current version is greater than previous.');
      core.setOutput('version-updated', 'false');
      return;
    }
    
    if (comparison < 0) {
      core.warning(`⚠️  Version ${currentVersion} is lower than previous version ${previousVersion}!`);
      core.info('🔧 Auto-fixing version number...');
      
      // Generate new version
      const newVersion = generateNextVersion(previousVersion);
      core.info(`📈 Auto-incrementing version: ${currentVersion} → ${newVersion}`);
      
      // Update pubspec.yaml
      if (!updatePubspecVersion(pubspecPath, newVersion)) {
        core.setFailed('❌ Failed to update pubspec.yaml');
        return;
      }
      
      // Verify the change
      const updatedVersion = getCurrentVersion(pubspecPath);
      core.info(`✅ Updated pubspec.yaml with version: ${updatedVersion}`);
      
      // Commit and push changes
      await commitAndPush(branch, newVersion, previousVersion, customMessage, token);
      
      core.info('🎉 Version has been auto-incremented and committed.');
      core.info(`🚀 The workflow will now continue with the new version: ${newVersion}`);
      
      // Set outputs
      core.setOutput('version-updated', 'true');
      core.setOutput('new-version', newVersion);
      core.setOutput('current-version', newVersion);
    }
    
  } catch (error) {
    core.setFailed(`❌ Action failed: ${error.message}`);
    core.debug(`Stack trace: ${error.stack}`);
  }
}

// Run the action
if (require.main === module) {
  run();
}

module.exports = {
  run,
  parseFlutterVersion,
  compareVersions,
  generateNextVersion
};
