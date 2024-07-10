// Usage: node increment-version.js minor "[minor] Added new feature"

const fs = require('fs');
const path = require('path');
const semver = require('semver');

// Read package.json
const packageFile = path.resolve(__dirname, 'package.json');
const packageData = fs.readFileSync(packageFile);
const packageJson = JSON.parse(packageData);

// Determine the type of change based on commit message or manual input
let releaseType = process.argv[2];  // Read release type from command line argument
const commitMessage = process.argv[3];  // Read commit message from command line argument

// Parse commit message to determine release type
if (!releaseType) {
  if (commitMessage.includes('[major]')) {
    releaseType = 'major';
  } else if (commitMessage.includes('[minor]')) {
    releaseType = 'minor';
  } else {
    releaseType = 'patch';  // Default to patch if no specific type found
  }
}

// Increment version based on release type
const newVersion = semver.inc(packageJson.version, releaseType);

if (!newVersion) {
  console.error(`Invalid release type: ${releaseType}`);
  process.exit(1);
}

// Update package.json with the new version
packageJson.version = newVersion;
fs.writeFileSync(packageFile, JSON.stringify(packageJson, null, 2));

console.log(`Version updated to ${newVersion}`);
