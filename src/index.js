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
 * @returns {string} - Command output
 */
async function execGit(args) {
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
    ignoreReturnCode: true
  };
  
  const exitCode = await exec.exec('git', args, options);
  
  if (exitCode !== 0) {
    core.warning(`Git command failed: git ${args.join(' ')}\nError: ${error}`);
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
    // Fetch the branch history
    await execGit(['fetch', 'origin', branch, '--unshallow']);
    
    core.info(`Searching for previous version in ${branch} branch...`);
    
    // Check last 20 commits for version changes
    for (let i = 1; i <= 20; i++) {
      const commitHash = await execGit(['rev-parse', `HEAD~${i}`]);
      if (!commitHash) break;
      
      // Get pubspec.yaml content from this commit
      const pubspecContent = await execGit(['show', `${commitHash}:pubspec.yaml`]);
      if (!pubspecContent) continue;
      
      try {
        const doc = yaml.load(pubspecContent);
        const commitVersion = doc.version;
        
        if (commitVersion && commitVersion !== currentVersion) {
          core.info(`Found previous version: ${commitVersion} (from commit ${commitHash.substring(0, 8)})`);
          return commitVersion;
        }
      } catch (error) {
        // Skip invalid YAML
        continue;
      }
    }
    
    // Also check merge commits
    core.info(`Checking recent merge commits in ${branch}...`);
    const mergeCommits = await execGit(['log', `origin/${branch}`, '--merges', '--oneline', '-n', '10', '--format=%H']);
    
    if (mergeCommits) {
      const commits = mergeCommits.split('\n').filter(line => line.trim());
      
      for (const commit of commits) {
        const pubspecContent = await execGit(['show', `${commit}:pubspec.yaml`]);
        if (!pubspecContent) continue;
        
        try {
          const doc = yaml.load(pubspecContent);
          const commitVersion = doc.version;
          
          if (commitVersion && commitVersion !== currentVersion) {
            core.info(`Found previous version from merge: ${commitVersion} (from commit ${commit.substring(0, 8)})`);
            return commitVersion;
          }
        } catch (error) {
          // Skip invalid YAML
          continue;
        }
      }
    }
    
    return null;
  } catch (error) {
    core.warning(`Error finding previous version: ${error.message}`);
    return null;
  }
}

/**
 * Configure git for committing
 */
async function configureGit() {
  await execGit(['config', '--local', 'user.email', 'action@github.com']);
  await execGit(['config', '--local', 'user.name', 'GitHub Action Auto-Fix']);
}

/**
 * Commit and push version changes with tag
 * @param {string} branch - Target branch
 * @param {string} newVersion - New version
 * @param {string} previousVersion - Previous version
 * @param {string} customMessage - Custom commit message
 */
async function commitAndPush(branch, newVersion, previousVersion, customMessage) {
  await configureGit();
  
  const commitMessage = customMessage || `Auto-increment version to ${newVersion}

Previous version: ${previousVersion}
New version: ${newVersion}
Auto-generated by GitHub Actions`;

  await execGit(['add', 'pubspec.yaml']);
  await execGit(['commit', '-m', commitMessage]);
  
  // Create and push tag
  await execGit(['tag', '-a', `v${newVersion}`, '-m', `Staging release v${newVersion}`]);
  
  core.info(`Pushing version update and tag to ${branch}...`);
  await execGit(['push', 'origin', branch]);
  await execGit(['push', 'origin', `v${newVersion}`]);
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
    
    core.info(`Checking Flutter version in ${pubspecPath} against ${branch} branch...`);
    
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
    
    if (comparison > 0) {
      core.info('Version check passed! Current version is greater than previous.');
      core.setOutput('version-updated', 'false');
      return;
    }
    
    if (comparison <= 0) {
      core.warning(`Version ${currentVersion} is not greater than previous version ${previousVersion}!`);
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
      
      // Commit and push changes
      await commitAndPush(branch, newVersion, previousVersion, customMessage);
      
      core.info('Version has been auto-incremented and committed.');
      core.info(`The workflow will now continue with the new version: ${newVersion}`);
      
      // Set outputs
      core.setOutput('version-updated', 'true');
      core.setOutput('new-version', newVersion);
      core.setOutput('current-version', newVersion);
    }
    
  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
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
