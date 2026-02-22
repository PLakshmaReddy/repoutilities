const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

class GitHelper {
  constructor(repoPath, credentials = null) {
    this.repoPath = repoPath;
    this.credentials = credentials; // { username, token }
  }

  async exec(args) {
    try {
      const { stdout } = await execFileAsync('git', args, {
        cwd: this.repoPath,
        encoding: 'utf8',
      });
      return stdout.trim();
    } catch (error) {
      const stderr = error.stderr ? error.stderr.toString() : '';
      throw new Error(`Git command failed: git ${args.join(' ')}\nError: ${stderr || error.message}`);
    }
  }

  async branchLocal() {
    const output = await this.exec(['branch', '--format=%(refname:short)']);
    const branches = output.split('\n').filter(b => b.trim() !== '');
    return { all: branches };
  }

  async fetch() {
    return this.exec(['fetch', '--all']);
  }

  async clone(url, target) {
    let authenticatedUrl = url;
    if (this.credentials && this.credentials.username && this.credentials.token) {
      // Basic auth injection into URL for cloning
      // Example: https://username:token@bitbucket.org/repo.git
      authenticatedUrl = url.replace('https://', `https://${this.credentials.username}:${this.credentials.token}@`);
    }
    return execFileAsync('git', ['clone', authenticatedUrl, target], {
      cwd: this.repoPath,
      encoding: 'utf8'
    });
  }

  async diffSummary(args) {
    const output = await this.exec(['diff', '--name-only', ...args]);
    const files = output.split('\n').filter(f => f.trim() !== '').map(f => ({ file: f }));
    return { files };
  }

  async show(args) {
    return this.exec(['show', ...args]);
  }

  async checkout(branch) {
    return this.exec(['checkout', branch]);
  }

  async checkoutBranch(newBranch, baseBranch) {
    return this.exec(['checkout', '-b', newBranch, baseBranch]);
  }

  async pull(remote, branch) {
    return this.exec(['pull', remote, branch]);
  }

  async add(files) {
    return this.exec(['add', files]);
  }

  async commit(message) {
    try {
      await this.exec(['config', 'user.name', 'Repo Manager']);
      await this.exec(['config', 'user.email', 'repo-manager@internal.com']);
    } catch (e) {
      // Ignore if it fails
    }
    return this.exec(['commit', '-m', message]);
  }

  async push(remote, branch) {
    return this.exec(['push', remote, branch]);
  }
}

module.exports = (path, credentials) => new GitHelper(path, credentials);
