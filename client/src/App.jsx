import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Layout, Github, GitBranch, ShieldCheck, Activity, Rocket, ArrowLeft, GitCompare, ChevronRight } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

const App = () => {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRepos();
  }, []);

  const fetchRepos = async () => {
    try {
      const response = await axios.get(`${API_BASE}/repos`);
      setRepos(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching repos:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Github className="mr-2" /> RepoManager
          </h1>
          {selectedRepo && (
            <button
              onClick={() => setSelectedRepo(null)}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {!selectedRepo ? (
          <RepoList repos={repos} onSelectRepo={setSelectedRepo} />
        ) : (
          <RepoDetail repo={selectedRepo} />
        )}
      </main>
    </div>
  );
};

const RepoList = ({ repos, onSelectRepo }) => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {repos.map((repo) => (
      <div
        key={repo.id}
        className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onSelectRepo(repo)}
      >
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 truncate">{repo.name}</h3>
          <p className="mt-1 text-sm text-gray-500 truncate">{repo.url}</p>
        </div>
        <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-between items-center">
          <span className="text-sm font-medium text-blue-600">View details</span>
          <ChevronRight size={16} className="text-gray-400" />
        </div>
      </div>
    ))}
  </div>
);

const RepoDetail = ({ repo }) => {
  const [activeTab, setActiveTab] = useState('compare');
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await axios.get(`${API_BASE}/repos/${repo.id}/branches`);
        setBranches(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching branches:', error);
        setLoading(false);
      }
    };
    fetchBranches();
  }, [repo.id]);

  if (loading) return <div>Loading repository data...</div>;

  const tabs = [
    { id: 'compare', name: 'Compare Branches', icon: GitCompare },
    { id: 'release', name: 'Create Release', icon: Rocket },
    { id: 'reports', name: 'Reports', icon: ShieldCheck },
    { id: 'deployments', name: 'Deployments', icon: Activity },
  ];

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h2 className="text-xl font-bold leading-6 text-gray-900">{repo.name}</h2>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center`}
            >
              <tab.icon size={18} className="mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'compare' && <BranchCompare repoId={repo.id} branches={branches} />}
        {activeTab === 'release' && <ReleaseCreator repoId={repo.id} branches={branches} />}
        {activeTab === 'reports' && <ReportsView repoId={repo.id} branches={branches} />}
        {activeTab === 'deployments' && <DeploymentsView repoId={repo.id} branches={branches} />}
      </div>
    </div>
  );
};

const BranchCompare = ({ repoId, branches }) => {
  const [source, setSource] = useState(branches[0] || '');
  const [target, setTarget] = useState(branches[1] || branches[0] || '');
  const [diffData, setDiffData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/repos/${repoId}/compare`, {
        params: { source, target }
      });
      setDiffData(response.data);
    } catch (error) {
      console.error('Error comparing branches:', error);
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="flex space-x-4 mb-6 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Source Branch</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Target Branch</label>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <button
          onClick={handleCompare}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Comparing...' : 'Compare'}
        </button>
      </div>

      {diffData && (
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">Diff: {source} → {target}</h4>
          {diffData.diffs.map((diff, idx) => (
            <div key={idx} className="border rounded-md overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b font-mono text-sm">{diff.file}</div>
              <pre className="p-4 text-xs overflow-x-auto bg-white font-mono">
                {diff.patch.split('\n').map((line, i) => {
                  let color = 'text-gray-800';
                  if (line.startsWith('+')) color = 'text-green-600 bg-green-50';
                  else if (line.startsWith('-')) color = 'text-red-600 bg-red-50';
                  else if (line.startsWith('@@')) color = 'text-blue-500';
                  return <div key={i} className={color}>{line}</div>;
                })}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ReleaseCreator = ({ repoId, branches }) => {
  const [baseBranch, setBaseBranch] = useState('main');
  const [version, setVersion] = useState('1.1.0');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCreateRelease = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/repos/${repoId}/release`, {
        baseBranch,
        releaseVersion: version
      });
      setResult(response.data);
    } catch (error) {
      console.error('Error creating release:', error);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Base Branch</label>
          <select
            value={baseBranch}
            onChange={(e) => setBaseBranch(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm"
          >
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Release Version</label>
          <input
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm"
            placeholder="e.g. 1.2.0"
          />
        </div>
        <button
          onClick={handleCreateRelease}
          disabled={loading}
          className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Create Release Branch & Update POM'}
        </button>
      </div>
      {result && (
        <div className={`mt-4 p-4 rounded-md ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {result.message}
        </div>
      )}
    </div>
  );
};

const ReportsView = ({ repoId, branches }) => {
  const [branch, setBranch] = useState(branches[0] || '');
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/repos/${repoId}/reports`, { params: { branch } });
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
    setLoading(false);
  };

  useEffect(() => { if (branch) fetchReports(); }, [branch]);

  return (
    <div>
      <div className="mb-6 w-64">
        <label className="block text-sm font-medium text-gray-700">Select Branch</label>
        <select
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm"
        >
          {branches.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {loading ? <div>Loading reports...</div> : reports && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ReportCard title="Code Coverage" status={reports.coverage.status} data={[
            { label: 'Line', value: `${reports.coverage.line}%` },
            { label: 'Branch', value: `${reports.coverage.branch}%` }
          ]} />
          <ReportCard title="Test Results" status={reports.tests.status} data={[
            { label: 'Passed', value: reports.tests.passed },
            { label: 'Failed', value: reports.tests.failed },
            { label: 'Skipped', value: reports.tests.skipped }
          ]} />
          <ReportCard title="Security Scan" status={reports.security.status} data={[
            { label: 'High', value: reports.security.high, color: 'text-red-600' },
            { label: 'Medium', value: reports.security.medium, color: 'text-yellow-600' },
            { label: 'Low', value: reports.security.low, color: 'text-blue-600' }
          ]} />
        </div>
      )}
    </div>
  );
};

const ReportCard = ({ title, status, data }) => (
  <div className="border rounded-lg p-4 bg-white shadow-sm">
    <div className="flex justify-between items-center mb-4">
      <h5 className="font-semibold text-gray-700">{title}</h5>
      <span className={`text-xs px-2 py-1 rounded-full font-bold ${
        status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
        status === 'WARNING' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
      }`}>{status}</span>
    </div>
    <div className="space-y-2">
      {data.map((item, idx) => (
        <div key={idx} className="flex justify-between text-sm">
          <span className="text-gray-500">{item.label}</span>
          <span className={`font-bold ${item.color || 'text-gray-900'}`}>{item.value}</span>
        </div>
      ))}
    </div>
  </div>
);

const DeploymentsView = ({ repoId, branches }) => {
  const [branch, setBranch] = useState(branches[0] || '');
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDeployments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/repos/${repoId}/deployments`, { params: { branch } });
      setDeployments(response.data);
    } catch (error) {
      console.error('Error fetching deployments:', error);
    }
    setLoading(false);
  };

  useEffect(() => { if (branch) fetchDeployments(); }, [branch]);

  return (
    <div>
      <div className="mb-6 w-64">
        <label className="block text-sm font-medium text-gray-700">Select Branch</label>
        <select
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm"
        >
          {branches.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {loading ? <div>Loading deployments...</div> : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Environment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Deployed</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deployments.map((dep, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dep.env}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      dep.status === 'DEPLOYED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>{dep.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{dep.version}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dep.lastDeployed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default App;
