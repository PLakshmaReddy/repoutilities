# Bitbucket Repo Manager (AWS Native)

A UI application to manage Bitbucket repositories, compare branches, create release branches, and view reports/deployments.

## Features

-   **Dashboard**: List of repositories from `config.json` or AWS Secrets Manager.
-   **Branch Compare**: Custom file-level comparison using `simple-git`.
-   **Release Automation**: Branch creation and `pom.xml` version updates.
-   **AWS Native Reports**: Integrates with AWS CodeBuild and AWS Security Hub (placeholders).
-   **Jules Integration**: Deployment status dashboard.

## Tech Stack

-   **Backend**: Node.js, Express, custom Git helper, AWS SDK v3
-   **Frontend**: React, Vite, Tailwind CSS
-   **Infrastructure**: Docker, AWS App Runner, AWS Secrets Manager

## AWS Native Configuration

To run as an AWS native application:

1.  **Secrets Manager**: Create a secret in AWS Secrets Manager (e.g., `BitbucketRepoManagerConfig`) with the content of your `config.json`.
2.  **Environment Variables**:
    - `CONFIG_SECRET_ID`: The name/ID of your secret.
    - `AWS_REGION`: Your AWS region (default: `us-east-1`).

## Local Development (Docker)

```bash
docker-compose up --build
```

## AWS Deployment

### Automated Deployment (CI/CD)

This repository includes a GitHub Actions workflow in `.github/workflows/deploy.yml`. To use it:
1.  Add the following secrets to your GitHub repository:
    - `AWS_ACCESS_KEY_ID`
    - `AWS_SECRET_ACCESS_KEY`
    - `AWS_APP_RUNNER_ROLE_ARN` (The IAM role App Runner uses to access ECR and Secrets Manager)
2.  On every push to the `main` branch, the application will be automatically built, pushed to ECR, and deployed to AWS App Runner.

### Manual Deployment

You can use the provided `deploy.sh` script to deploy from your local machine:
```bash
./deploy.sh
```
*Note: Ensure you have the AWS CLI configured with appropriate permissions.*

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
