# Bitbucket Repo Manager

A UI application to manage Bitbucket repositories, compare branches, create release branches, and view reports/deployments.

## Features

-   **Dashboard**: List of repositories from `config.json`.
-   **Branch Compare**: Custom file-level comparison using Git.
-   **Release Automation**: Branch creation and `pom.xml` version updates.
-   **Reports**: View code coverage, test results, and security scans.
-   **Jules Integration**: Deployment status dashboard.

## Tech Stack

-   **Backend**: Node.js, Express, custom Git helper
-   **Frontend**: React, Vite, Tailwind CSS
-   **Infrastructure**: Docker

## Local Development (Docker)

```bash
docker-compose up --build
```

## Local Development (Manual)

1.  **Backend**:
    ```bash
    npm install
    node server.js
    ```

2.  **Frontend**:
    ```bash
    cd client
    npm install
    npm run dev
    ```

## Configuration

Edit `config.json` in the root directory to configure your repositories:

```json
{
  "repositories": [
    {
      "id": "repo-1",
      "name": "my-service",
      "url": "https://bitbucket.org/org/repo"
    }
  ]
}
```

Repositories should be placed in a `repos/` directory in the root.
