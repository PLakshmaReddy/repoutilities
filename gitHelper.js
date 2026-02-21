const { execFileSync } = require('child_process');

class GitHelper {
  constructor(repoPath) {
    this.repoPath = repoPath;
  }

  exec(args) {
    try {
      return execFileSync('git', args, {
        cwd: this.repoPath,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
      }).trim();
    } catch (error) {
      const stderr = error.stderr ? error.stderr.toString() : '';
      throw new Error(`Git command failed: git ${args.join(' ')}\nError: ${stderr || error.message}`);
    }
  }

  async branchLocal() {
    const output = this.exec(['branch', '--format=%(refname:short)']);
    const branches = output.split('\n').filter(b => b.trim() !== '');
    return { all: branches };
  }

  async fetch() {
    return this.exec(['fetch', '--all']);
  }

  async clone(url, target) {
    return execFileSync('git', ['clone', url, target], {
      cwd: this.repoPath,
      encoding: 'utf8'
    });
  }

  async diffSummary(args) {
    // args is typically ["source..target"]
    const output = this.exec(['diff', '--name-only', ...args]);
    const files = output.split('\n').filter(f => f.trim() !== '').map(f => ({ file: f }));
    return { files };
  }

  async show(args) {
    // args is typically ["branch:file"]
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
      this.exec(['config', 'user.name', 'Repo Manager']);
      this.exec(['config', 'user.email', 'repo-manager@internal.com']);
    } catch (e) {
      // Ignore if it fails
    }
    return this.exec(['commit', '-m', message]);
  }
}

module.exports = (path) => new GitHelper(path);
