# Bitbucket Repo Manager

A UI application to manage Bitbucket repositories, compare branches, create release branches, and view reports/deployments.

## Features

1.  **Show list of configured repositories**: Managed via `config.json`.
2.  **Compare branches**: Custom file-level comparison between any two branches.
3.  **Create Release Branch**: Automatically creates a new branch and updates the version in `pom.xml`.
4.  **Reports**: View code coverage, test results, and security scans.
5.  **Deployments**: Integration with Jules pipeline to show environment status.

## Tech Stack

-   **Backend**: Node.js, Express, simple-git
-   **Frontend**: React, Vite, Tailwind CSS, Lucide icons

## Setup

1.  **Install dependencies**:
    ```bash
    npm install
    cd client && npm install
    ```

2.  **Configure repositories**:
    Edit `config.json` to add your Bitbucket repositories.

3.  **Local Repositories**:
    Cloned repositories should be placed in a `repos/` directory in the root for the backend to interact with them.

4.  **Run the application**:
    - Backend: `node server.js`
    - Frontend: `cd client && npm run dev`
