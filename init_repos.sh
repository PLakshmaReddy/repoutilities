#!/bin/bash
rm -rf repos
mkdir -p repos
REPOS=("payment-service" "auth-service" "inventory-management")

for REPO in "${REPOS[@]}"; do
    echo "Initializing $REPO..."
    mkdir -p "repos/$REPO"
    cd "repos/$REPO"
    git init -b main
    git config user.email "you@example.com"
    git config user.name "Your Name"
    echo "Initial content for $REPO" > README.md
    echo "<project><version>1.0.0</version></project>" > pom.xml
    git add .
    git commit -m "Initial commit"
    git checkout -b develop
    echo "Developing $REPO" >> README.md
    git add .
    git commit -m "Develop commit"
    git checkout main
    cd ../..
done
