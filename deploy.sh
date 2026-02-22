#!/bin/bash

# Configuration
REGION="us-east-1"
REPO_NAME="bitbucket-repo-manager"
STACK_NAME="bitbucket-repo-manager-stack"

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
if [ $? -ne 0 ]; then
    echo "Error: AWS CLI not configured or missing permissions."
    exit 1
fi

ECR_URL="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

echo "1. Creating ECR repository if it doesn't exist..."
aws ecr describe-repositories --repository-names ${REPO_NAME} --region ${REGION} || \
aws ecr create-repository --repository-name ${REPO_NAME} --region ${REGION}

echo "2. Logging into ECR..."
aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ECR_URL}

echo "3. Building Docker image..."
docker build -t ${REPO_NAME} .

echo "4. Tagging and Pushing image..."
docker tag ${REPO_NAME}:latest ${ECR_URL}/${REPO_NAME}:latest
docker push ${ECR_URL}/${REPO_NAME}:latest

echo "5. Deploying Infrastructure via CloudFormation/SAM..."
# Note: This assumes you have the template.yaml in the root
aws cloudformation deploy \
    --template-file template.yaml \
    --stack-name ${STACK_NAME} \
    --capabilities CAPABILITY_IAM \
    --parameter-overrides ConfigSecretId=BitbucketRepoManagerConfig

echo "Deployment complete!"
