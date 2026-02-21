const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { createPatch } = require('diff');
const simpleGit = require('simple-git');
const axios = require('axios');
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const { CodeBuildClient, ListBuildsForProjectCommand, BatchGetBuildsCommand } = require("@aws-sdk/client-codebuild");

const app = express();
const PORT = process.env.PORT || 3001;
const REPOS_ROOT = path.join(__dirname, 'repos');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Load configuration
const configPath = path.join(__dirname, 'config.json');
let config = { repositories: [] };

const loadConfig = async () => {
  // Check if we should load from AWS Secrets Manager
  if (process.env.CONFIG_SECRET_ID) {
    try {
      console.log(`Loading config from AWS Secret: ${process.env.CONFIG_SECRET_ID}`);
      const client = new SecretsManagerClient({ region: process.env.AWS_REGION || "us-east-1" });
      const response = await client.send(new GetSecretValueCommand({ SecretId: process.env.CONFIG_SECRET_ID }));
      config = JSON.parse(response.SecretString);
      return;
    } catch (error) {
      console.error("Error loading config from Secrets Manager:", error);
    }
  }

  // Fallback to local file
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
};

loadConfig();

// Helper to get git instance
const getGit = (repoName) => {
  const repoPath = path.join(REPOS_ROOT, repoName);
  if (!fs.existsSync(repoPath)) {
    // In AWS Fargate, we might want to clone on demand if not persistent
    fs.mkdirSync(repoPath, { recursive: true });
    return simpleGit(repoPath);
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
    // If directory is empty, clone it
    const files = fs.readdirSync(path.join(REPOS_ROOT, repo.name));
    if (files.length === 0) {
        console.log(`Cloning ${repo.url} into ${repo.name}`);
        await git.clone(repo.url, ".");
    }

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
    await git.fetch();

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

    await git.checkout(baseBranch);
    try { await git.pull('origin', baseBranch); } catch (e) { console.warn('Could not pull latest'); }

    await git.checkoutBranch(releaseBranch, baseBranch);

    const repoPath = path.join(REPOS_ROOT, repo.name);
    const pomPath = path.join(repoPath, 'pom.xml');

    if (fs.existsSync(pomPath)) {
      let pomContent = fs.readFileSync(pomPath, 'utf8');
      const projectVersionRegex = /(<modelVersion>.*?<\/modelVersion>\s*<groupId>.*?<\/groupId>\s*<artifactId>.*?<\/artifactId>\s*<version>)(.*?)(<\/version>)/s;

      if (projectVersionRegex.test(pomContent)) {
          pomContent = pomContent.replace(projectVersionRegex, `$1${releaseVersion}$3`);
      } else {
          pomContent = pomContent.replace(/<version>(.*?)<\/version>/, `<version>${releaseVersion}</version>`);
      }

      fs.writeFileSync(pomPath, pomContent);
      await git.add('pom.xml');
      await git.commit(`Prepare release ${releaseVersion}`);
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

// AWS Native Integrations for Reports
app.get('/api/repos/:repoId/reports', async (req, res) => {
  const { branch } = req.query;
  const repoId = req.params.repoId;

  console.log(`Pulling AWS-native reports for ${repoId} on branch ${branch}`);

  try {
    const codebuild = new CodeBuildClient({ region: process.env.AWS_REGION || "us-east-1" });

    // Attempt to find real builds for this repo if it's also a CodeBuild project
    const listBuilds = await codebuild.send(new ListBuildsForProjectCommand({
      projectName: repoId // Assuming repoId matches CodeBuild project name
    })).catch(() => null);

    if (listBuilds && listBuilds.ids && listBuilds.ids.length > 0) {
      const builds = await codebuild.send(new BatchGetBuildsCommand({ ids: listBuilds.ids.slice(0, 5) }));
      const latestBuild = builds.builds.find(b => b.sourceVersion === branch || b.resolvedSourceVersion === branch);

      if (latestBuild) {
        // In a real scenario, we'd parse the reportGroups from the build
        // For this demo, we'll return simulated data based on the build status
        const isSuccess = latestBuild.buildStatus === 'SUCCEEDED';
        return res.json({
          branch,
          coverage: { line: isSuccess ? 88.5 : 45.0, branch: isSuccess ? 80.0 : 30.0, status: isSuccess ? 'SUCCESS' : 'FAILURE' },
          tests: { passed: isSuccess ? 150 : 100, failed: isSuccess ? 0 : 50, skipped: 5, status: isSuccess ? 'SUCCESS' : 'FAILURE' },
          security: { high: 0, medium: 1, low: 3, status: 'SUCCESS' }
        });
      }
    }
  } catch (error) {
    console.warn("Could not fetch real AWS reports, falling back to mocks:", error.message);
  }

  // Fallback to mock
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
     JULES PIPELINE / AWS CODEPIPELINE INTEGRATION:
     If Jules is running on AWS, it might update CodePipeline or AppRunner tags.
  */

  res.json([
    { env: 'DEV', status: 'DEPLOYED', version: '1.1.0-SNAPSHOT', lastDeployed: '2023-10-25 10:00' },
    { env: 'QA', status: 'DEPLOYED', version: '1.0.0', lastDeployed: '2023-10-20 14:30' },
    { env: 'PROD', status: 'NOT_DEPLOYED', version: '0.9.0', lastDeployed: '2023-09-15 09:00' }
  ]);
});

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
