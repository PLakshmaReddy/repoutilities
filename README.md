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

1.  **Build and Push to ECR**:
    ```bash
    aws ecr create-repository --repository-name bitbucket-repo-manager
    docker build -t bitbucket-repo-manager .
    docker tag bitbucket-repo-manager:latest <account-id>.dkr.ecr.<region>.amazonaws.com/bitbucket-repo-manager:latest
    aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
    docker push <account-id>.dkr.ecr.<region>.amazonaws.com/bitbucket-repo-manager:latest
    ```

2.  **Deploy using SAM**:
    ```bash
    sam deploy --guided
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
