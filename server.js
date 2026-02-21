const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { createPatch } = require('diff');
const simpleGit = require('simple-git');
const axios = require('axios'); // For future real integrations

const app = express();
const PORT = process.env.PORT || 3001;
const REPOS_ROOT = path.join(__dirname, 'repos');

app.use(cors());
app.use(bodyParser.json());

// Load configuration
const configPath = path.join(__dirname, 'config.json');
let config = { repositories: [] };
if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

// Helper to get git instance
const getGit = (repoName) => {
  const repoPath = path.join(REPOS_ROOT, repoName);
  if (!fs.existsSync(repoPath)) {
    throw new Error(`Repository path not found: ${repoPath}. Ensure repos are cloned in the /repos directory.`);
  }
  return simpleGit(repoPath);
};

// Routes
app.get('/api/repos', (req, res) => {
  res.json(config.repositories);
});

app.get('/api/repos/:repoId/branches', async (req, res) => {
  try {
    const repo = config.repositories.find(r => r.id === req.params.repoId);
    if (!repo) return res.status(404).send('Repo not found');

    const git = getGit(repo.name);
    // Fetch latest info from remote if possible
    try { await git.fetch(); } catch (e) { console.warn(`Could not fetch for ${repo.name}: ${e.message}`); }

    const branches = await git.branchLocal();
    res.json(branches.all);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/repos/:repoId/compare', async (req, res) => {
  const { source, target } = req.query;
  const repoId = req.params.repoId;
  const repo = config.repositories.find(r => r.id === repoId);

  if (!repo) return res.status(404).send('Repo not found');

  try {
    const git = getGit(repo.name);
    await git.fetch(); // Ensure we have latest data

    // Requirement 3: Compare two differences branches use file comparator
    const diffSummary = await git.diffSummary([`${source}..${target}`]);

    const diffs = await Promise.all(diffSummary.files.map(async (fileInfo) => {
      const file = fileInfo.file;
      try {
        const sourceContent = await git.show([`${source}:${file}`]);
        const targetContent = await git.show([`${target}:${file}`]);
        const patch = createPatch(file, sourceContent, targetContent, source, target);
        return { file, patch };
      } catch (e) {
        return { file, patch: `Error comparing ${file}: ${e.message}` };
      }
    }));

    res.json({ source, target, diffs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/repos/:repoId/release', async (req, res) => {
  const { baseBranch, releaseVersion } = req.body;
  const repoId = req.params.repoId;
  const repo = config.repositories.find(r => r.id === repoId);

  if (!repo) return res.status(404).send('Repo not found');

  try {
    const git = getGit(repo.name);
    const releaseBranch = `release/${releaseVersion}`;

    // 1. Ensure base branch is latest
    await git.checkout(baseBranch);
    try { await git.pull('origin', baseBranch); } catch (e) { console.warn('Could not pull latest'); }

    // 2. Create and checkout release branch
    await git.checkoutBranch(releaseBranch, baseBranch);

    // 3. Update pom.xml
    const repoPath = path.join(REPOS_ROOT, repo.name);
    const pomPath = path.join(repoPath, 'pom.xml');

    if (fs.existsSync(pomPath)) {
      let pomContent = fs.readFileSync(pomPath, 'utf8');

      // Improved regex to target the project version specifically (usually after modelVersion)
      const projectVersionRegex = /(<modelVersion>.*?<\/modelVersion>\s*<groupId>.*?<\/groupId>\s*<artifactId>.*?<\/artifactId>\s*<version>)(.*?)(<\/version>)/s;

      if (projectVersionRegex.test(pomContent)) {
          pomContent = pomContent.replace(projectVersionRegex, `$1${releaseVersion}$3`);
      } else {
          // Fallback to simpler regex if structure is slightly different
          pomContent = pomContent.replace(/<version>(.*?)<\/version>/, `<version>${releaseVersion}</version>`);
      }

      fs.writeFileSync(pomPath, pomContent);

      // 4. Commit and Push (Push commented out for safety in this environment)
      await git.add('pom.xml');
      await git.commit(`Prepare release ${releaseVersion}`);
      // await git.push('origin', releaseBranch);
    }

    res.json({
      success: true,
      message: `Release branch ${releaseBranch} created and pom.xml updated to ${releaseVersion}`,
      branch: releaseBranch
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Integration placeholders
app.get('/api/repos/:repoId/reports', async (req, res) => {
  const { branch } = req.query;
  const repoId = req.params.repoId;

  /*
     REAL INTEGRATION EXAMPLE:
     const response = await axios.get(`https://sonar.mycompany.com/api/measures/component`, {
       params: { component: repoId, branch: branch, metricKeys: 'coverage,bugs,vulnerabilities' }
     });
     // process response...
  */

  // Return mock for now as we don't have real report server access
  res.json({
    branch,
    coverage: { line: 85.5, branch: 78.2, status: 'SUCCESS' },
    tests: { passed: 124, failed: 0, skipped: 2, status: 'SUCCESS' },
    security: { high: 0, medium: 2, low: 5, status: 'WARNING' }
  });
});

app.get('/api/repos/:repoId/deployments', async (req, res) => {
  const { branch } = req.query;

  /*
     JULES PIPELINE INTEGRATION EXAMPLE:
     const response = await axios.get(`https://jules.mycompany.com/api/deployments`, {
       params: { branch: branch }
     });
     return response.data;
  */

  res.json([
    { env: 'DEV', status: 'DEPLOYED', version: '1.1.0-SNAPSHOT', lastDeployed: '2023-10-25 10:00' },
    { env: 'QA', status: 'DEPLOYED', version: '1.0.0', lastDeployed: '2023-10-20 14:30' },
    { env: 'PROD', status: 'NOT_DEPLOYED', version: '0.9.0', lastDeployed: '2023-09-15 09:00' }
  ]);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
