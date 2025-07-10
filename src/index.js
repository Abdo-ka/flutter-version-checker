const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const fs = require('fs');
const path = require('path');
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
  if (currentParsed.build < previousParsed.build) return -1;
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
    const message = `Git command failed: git ${args.join(' ')}\nError: ${error.trim()}\nOutput: ${output.trim()}`;
    if (throwOnError) {
      const gitError = new Error(message);
      gitError.exitCode = exitCode;
      gitError.stderr = error.trim();
      gitError.stdout = output.trim();
      throw gitError;
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
    
    // Fetch the target branch safely - avoid the refusing to fetch error
    try {
      await execGit(['fetch', 'origin', branch], false);
    } catch (fetchError) {
      core.warning(`Failed to fetch ${branch}: ${fetchError.message}`);
      // Try alternative approach
      await execGit(['fetch', 'origin'], false);
    }
    
    core.info(`Searching for previous version in ${branch} branch history...`);
    
    // Get the commit history for the target branch - try different approaches
    let commits;
    try {
      const commitHashes = await execGit(['rev-list', `origin/${branch}`, '--max-count=100']);
      commits = commitHashes.split('\n').filter(hash => hash.trim());
    } catch (error) {
      // Fallback to current branch if origin/branch doesn't exist
      core.warning(`Could not access origin/${branch}, using current branch`);
      const commitHashes = await execGit(['rev-list', 'HEAD', '--max-count=100']);
      commits = commitHashes.split('\n').filter(hash => hash.trim());
    }
    
    if (!commits || commits.length === 0) {
      core.warning('No commit history found');
      return null;
    }
    
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
              core.warning(`Version ${currentVersion} was found in ${sameVersionCount} commits! This indicates version reuse.`);
              core.info(`Returning current version as previous to force increment: ${currentVersion}`);
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
      core.warning(`Found ${sameVersionCount} commits with the same version ${currentVersion}!`);
      core.info(`Version reuse detected. Returning current version to force increment.`);
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
 * @param {string} userEmail - Git user email
 * @param {string} userName - Git user name
 */
async function configureGit(token, userEmail = null, userName = null) {
  try {
    core.info('Configuring Git for automated commits...');
    
    // Use provided user config or fallback to multiple options
    let userConfigs;
    if (userEmail && userName) {
      userConfigs = [{ email: userEmail, name: userName }];
    } else {
      // Try multiple user identity approaches for maximum compatibility
      userConfigs = [
        // Option 1: Simple action identity (your previous working config)
        { email: 'action@github.com', name: 'GitHub Action Auto-Fix' },
        // Option 2: GitHub Actions bot identity
        { email: '41898282+github-actions[bot]@users.noreply.github.com', name: 'github-actions[bot]' },
        // Option 3: Generic noreply identity
        { email: 'noreply@github.com', name: 'GitHub Actions' }
      ];
    }
    
    let configSuccess = false;
    for (let i = 0; i < userConfigs.length; i++) {
      try {
        const config = userConfigs[i];
        core.info(`Attempting Git user config ${i + 1}: ${config.name} <${config.email}>`);
        
        await execGit(['config', '--local', 'user.email', config.email], true);
        await execGit(['config', '--local', 'user.name', config.name], true);
        
        configSuccess = true;
        core.info(`✅ Successfully configured Git user: ${config.name} <${config.email}>`);
        break;
      } catch (configError) {
        core.warning(`❌ Config attempt ${i + 1} failed: ${configError.message}`);
        if (i === userConfigs.length - 1) {
          throw configError;
        }
      }
    }
    
    if (!configSuccess) {
      throw new Error('All Git user configuration attempts failed');
    }
    
    // Configure git to be more permissive with permissions
    await execGit(['config', '--local', 'core.filemode', 'false'], false);
    await execGit(['config', '--local', 'core.autocrlf', 'false'], false);
    await execGit(['config', '--local', 'core.safecrlf', 'false'], false);
    
    // Configure authentication if token is provided
    if (token) {
      const context = github.context;
      const { owner, repo } = context.repo;
      
      // Multiple authentication approaches for maximum compatibility
      core.info('Setting up Git authentication...');
      
      // Method 1: Set remote URL with token (most reliable)
      const authenticatedUrl = `https://x-access-token:${token}@github.com/${owner}/${repo}.git`;
      await execGit(['remote', 'set-url', 'origin', authenticatedUrl], true);
      
      // Method 2: Configure credential helper (backup approach)
      try {
        await execGit(['config', '--local', 'credential.helper', ''], false);
        await execGit(['config', '--local', 'credential.helper', 'store --file=.git/credentials'], false);
        
        // Method 3: Store credentials for the session
        const credentialsContent = `https://x-access-token:${token}@github.com`;
        fs.writeFileSync('.git/credentials', credentialsContent, { mode: 0o600 });
      } catch (credError) {
        core.warning(`Credential helper setup failed (non-critical): ${credError.message}`);
      }
      
      core.info('Git authentication configured successfully');
      
      // Verify authentication with multiple approaches
      const authTests = [
        { command: ['ls-remote', '--exit-code', 'origin', 'HEAD'], name: 'ls-remote test' },
        { command: ['fetch', '--dry-run', 'origin'], name: 'fetch dry-run test' }
      ];
      
      let authVerified = false;
      for (const test of authTests) {
        try {
          await execGit(test.command, false);
          core.info(`✅ Git authentication verified with ${test.name}`);
          authVerified = true;
          break;
        } catch (authError) {
          core.warning(`⚠️ ${test.name} failed: ${authError.message}`);
        }
      }
      
      if (!authVerified) {
        core.warning('⚠️ Could not verify Git authentication, but proceeding anyway');
      }
    } else {
      core.warning('⚠️ No GitHub token available - Git operations may fail without proper authentication');
      core.info('💡 Ensure your workflow has the GITHUB_TOKEN available or pass a token explicitly');
    }
  } catch (error) {
    core.error(`❌ Failed to configure git: ${error.message}`);
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
 * @param {string} userEmail - Git user email
 * @param {string} userName - Git user name
 */
async function commitAndPush(branch, newVersion, previousVersion, customMessage, token, userEmail, userName) {
  try {
    await configureGit(token);
    
    const commitMessage = customMessage || `🔄 Auto-increment version to ${newVersion}

Previous version: ${previousVersion}
New version: ${newVersion}
Auto-generated by GitHub Actions

[skip ci]`;

    // Check if there are changes to commit
    const status = await execGit(['status', '--porcelain']);
    if (!status) {
      core.info('No changes to commit');
      return;
    }

    core.info(`📝 Staging pubspec.yaml changes...`);
    await execGit(['add', 'pubspec.yaml'], true);
    
    // Verify the file is staged
    const stagedFiles = await execGit(['diff', '--cached', '--name-only']);
    core.info(`Staged files: ${stagedFiles}`);
    
    core.info(`💾 Committing version update...`);
    await execGit(['commit', '-m', commitMessage], true);
    
    // Get the commit hash for verification
    const commitHash = await execGit(['rev-parse', 'HEAD']);
    core.info(`✅ Created commit: ${commitHash.substring(0, 8)}`);
    
    // Create and push tag
    const tagName = `v${newVersion}`;
    core.info(`🏷️ Creating tag ${tagName}...`);
    
    // Delete tag if it exists (in case of retry)
    await execGit(['tag', '-d', tagName], false);
    await execGit(['push', 'origin', ':refs/tags/' + tagName], false);
    
    // Create new tag
    await execGit(['tag', '-a', tagName, '-m', `Release ${tagName}`], true);
    
    core.info(`🚀 Pushing changes to ${branch}...`);
    
    // Try multiple push strategies for maximum compatibility
    let pushSuccess = false;
    const pushStrategies = [
      // Strategy 1: Push to specific branch
      ['push', 'origin', `HEAD:${branch}`],
      // Strategy 2: Push to current branch
      ['push', 'origin', 'HEAD'],
      // Strategy 3: Force push (use with caution)
      ['push', '--force-with-lease', 'origin', `HEAD:${branch}`]
    ];
    
    for (let i = 0; i < pushStrategies.length; i++) {
      try {
        core.info(`Attempting push strategy ${i + 1}...`);
        await execGit(pushStrategies[i], true);
        pushSuccess = true;
        core.info(`✅ Push successful with strategy ${i + 1}`);
        break;
      } catch (pushError) {
        core.warning(`❌ Push strategy ${i + 1} failed: ${pushError.message}`);
        if (i === pushStrategies.length - 1) {
          throw pushError; // Re-throw the last error if all strategies fail
        }
      }
    }
    
    if (!pushSuccess) {
      throw new Error('All push strategies failed');
    }
    
    core.info(`🏷️ Pushing tag ${tagName}...`);
    try {
      await execGit(['push', 'origin', tagName], true);
      core.info(`✅ Tag ${tagName} pushed successfully`);
    } catch (tagError) {
      core.warning(`⚠️ Failed to push tag: ${tagError.message}`);
      // Tag push failure shouldn't fail the entire action
    }
    
    core.info('🎉 Successfully pushed version update and tag');
  } catch (error) {
    core.error(`❌ Failed to commit and push: ${error.message}`);
    
    // Provide comprehensive debugging information
    core.error(`Error details: ${error.stack || error.toString()}`);
    
    try {
      // Debug information
      const status = await execGit(['status', '--porcelain'], false);
      core.info(`📊 Git status: ${status || 'clean'}`);
      
      const remoteInfo = await execGit(['remote', '-v'], false);
      core.info(`🔗 Git remotes: ${remoteInfo}`);
      
      const branchInfo = await execGit(['branch', '-v'], false);
      core.info(`🌿 Git branches: ${branchInfo}`);
      
      const configInfo = await execGit(['config', '--list', '--local'], false);
      core.info(`⚙️ Git config: ${configInfo}`);
      
    } catch (debugError) {
      core.warning(`Could not get git debug info: ${debugError.message}`);
    }
    
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
    let token = core.getInput('token');
    
    // Auto-detect GitHub token if not explicitly provided
    if (!token) {
      token = process.env.GITHUB_TOKEN;
      if (token) {
        core.info('🔍 No token input provided, using GITHUB_TOKEN from environment');
      }
    }
    
    const customMessage = core.getInput('commit-message');
    const gitUserEmail = core.getInput('git-user-email');
    const gitUserName = core.getInput('git-user-name');
    const pubspecPath = 'pubspec.yaml'; // Always in project root
    
    core.info(`Flutter Version Checker & Auto-Increment Action`);
    core.info(`Checking version in ${pubspecPath} against ${branch} branch...`);
    
    // Auto-detect token if not provided
    if (!token) {
      core.warning('⚠️ No GitHub token available. Auto-commits will be disabled.');
      core.info('💡 To enable auto-commits, ensure your workflow has proper permissions:');
      core.info('   permissions:');
      core.info('     contents: write');
    } else {
      core.info('✅ GitHub token detected - auto-commits enabled');
    }
    
    // Check if pubspec.yaml exists
    if (!fs.existsSync(pubspecPath)) {
      core.setFailed(`pubspec.yaml not found at ${pubspecPath}`);
      return;
    }
    
    // Get current version
    const currentVersion = getCurrentVersion(pubspecPath);
    if (!currentVersion) {
      core.setFailed('Could not read version from pubspec.yaml');
      return;
    }
    
    core.info(`Current version in pubspec.yaml: ${currentVersion}`);
    
    // Find previous version in branch history
    const previousVersion = await findPreviousVersion(branch, currentVersion);
    
    // Set outputs
    core.setOutput('previous-version', previousVersion || 'none');
    core.setOutput('current-version', currentVersion);
    
    if (!previousVersion) {
      core.info('Version check passed! No previous version found (first build).');
      core.setOutput('version-updated', 'false');
      return;
    }
    
    // Compare versions
    const comparison = compareVersions(currentVersion, previousVersion);
    
    core.info(`Comparing version numbers...`);
    core.info(`   Current version: ${currentVersion}`);
    core.info(`   Previous version: ${previousVersion}`);
    
    // Special case: if current version equals previous version, it indicates version reuse
    if (currentVersion === previousVersion) {
      core.warning(`Version reuse detected! Version ${currentVersion} was already used in previous commits.`);
      core.info('Auto-fixing version number due to version reuse...');
      
      // Generate new version based on current version
      const newVersion = generateNextVersion(currentVersion);
      core.info(`Auto-incrementing version: ${currentVersion} → ${newVersion}`);
      
      // Update pubspec.yaml
      if (!updatePubspecVersion(pubspecPath, newVersion)) {
        core.setFailed('Failed to update pubspec.yaml');
        return;
      }
      
      // Verify the change
      const updatedVersion = getCurrentVersion(pubspecPath);
      core.info(`Updated pubspec.yaml with version: ${updatedVersion}`);
      
      // Commit and push changes if token is available
      if (token) {
        await commitAndPush(branch, newVersion, currentVersion, customMessage, token, gitUserEmail, gitUserName);
        core.info('✅ Version has been auto-incremented due to reuse and committed.');
      } else {
        core.warning('⚠️ Version updated in pubspec.yaml but not committed (no token available)');
        core.info('💡 The updated version will be committed when you push your changes');
      }
      
      core.info(`The workflow will now continue with the new version: ${newVersion}`);
      
      // Set outputs
      core.setOutput('version-updated', 'true');
      core.setOutput('new-version', newVersion);
      core.setOutput('current-version', newVersion);
      return;
    }
    
    if (comparison > 0) {
      core.info('Version check passed! Current version is greater than previous.');
      core.setOutput('version-updated', 'false');
      return;
    }
    
    if (comparison < 0) {
      core.warning(`Version ${currentVersion} is lower than previous version ${previousVersion}!`);
      core.info('Auto-fixing version number...');
      
      // Generate new version
      const newVersion = generateNextVersion(previousVersion);
      core.info(`Auto-incrementing version: ${currentVersion} → ${newVersion}`);
      
      // Update pubspec.yaml
      if (!updatePubspecVersion(pubspecPath, newVersion)) {
        core.setFailed('Failed to update pubspec.yaml');
        return;
      }
      
      // Verify the change
      const updatedVersion = getCurrentVersion(pubspecPath);
      core.info(`Updated pubspec.yaml with version: ${updatedVersion}`);
      
      // Commit and push changes if token is available
      if (token) {
        await commitAndPush(branch, newVersion, previousVersion, customMessage, token, gitUserEmail, gitUserName);
        core.info('✅ Version has been auto-incremented and committed.');
      } else {
        core.warning('⚠️ Version updated in pubspec.yaml but not committed (no token available)');
        core.info('💡 The updated version will be committed when you push your changes');
      }
      
      core.info(`The workflow will now continue with the new version: ${newVersion}`);
      
      // Set outputs
      core.setOutput('version-updated', 'true');
      core.setOutput('new-version', newVersion);
      core.setOutput('current-version', newVersion);
    }
    
  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
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
