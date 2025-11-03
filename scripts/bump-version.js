#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function readPackageJson(pkgPath) {
  const raw = fs.readFileSync(pkgPath, 'utf8');
  return JSON.parse(raw);
}

function writePackageJson(pkgPath, obj) {
  const raw = JSON.stringify(obj, null, 2) + '\n';
  fs.writeFileSync(pkgPath, raw, 'utf8');
}

function bumpSemver(version) {
  // simple semver patch bump (major.minor.patch)
  const parts = version.split('.');
  if (parts.length < 3) {
    throw new Error('Version does not look like semver: ' + version);
  }
  const major = parseInt(parts[0], 10) || 0;
  const minor = parseInt(parts[1], 10) || 0;
  const patch = parseInt(parts[2], 10) || 0;
  return `${major}.${minor}.${patch + 1}`;
}

function run() {
  try {
    const repoRoot = path.resolve(__dirname, '..');
    const pkgPath = path.join(repoRoot, 'package.json');
    const pkg = readPackageJson(pkgPath);
    const oldVersion = pkg.version || '0.0.0';
    const newVersion = bumpSemver(oldVersion);

    if (newVersion === oldVersion) {
      console.log('Version unchanged:', oldVersion);
      return;
    }

    pkg.version = newVersion;
    writePackageJson(pkgPath, pkg);
    console.log(`Bumped version: ${oldVersion} -> ${newVersion}`);

    // Also write a runtime-accessible version file for the frontend (so dev server can pick it up without rebuild)
    try {
      const frontendVersionPath = path.join(repoRoot, 'frontend', 'public', 'version.json');
      const versionObj = { version: newVersion };
      // ensure directory exists (public should exist but be defensive)
      const frontendPublicDir = path.dirname(frontendVersionPath);
      if (!fs.existsSync(frontendPublicDir)) {
        fs.mkdirSync(frontendPublicDir, { recursive: true });
      }
      fs.writeFileSync(frontendVersionPath, JSON.stringify(versionObj, null, 2) + '\n', 'utf8');
      console.log('Wrote frontend runtime version to', frontendVersionPath);
    } catch (pvErr) {
      console.error('Failed to write frontend version file:', pvErr && pvErr.message ? pvErr.message : pvErr);
    }

    // stage and commit the change without running hooks to avoid recursion
    try {
      // stage both package.json and the frontend version file if it exists
      execSync('git add package.json', { stdio: 'inherit' });
      const frontendVersionPathRel = path.join('frontend', 'public', 'version.json');
      if (fs.existsSync(path.join(repoRoot, frontendVersionPathRel))) {
        execSync(`git add ${frontendVersionPathRel}`, { stdio: 'inherit' });
      }
      execSync(`git commit -m "chore: bump version to ${newVersion}" --no-verify`, { stdio: 'inherit' });
      console.log('Committed bumped version (hooks skipped).');
    } catch (gitErr) {
      console.error('Git commit failed:', gitErr && gitErr.message ? gitErr.message : gitErr);
      // leave package.json updated in working tree
    }
  } catch (err) {
    console.error('bump-version failed:', err && err.stack ? err.stack : err);
    process.exitCode = 1;
  }
}

run();
