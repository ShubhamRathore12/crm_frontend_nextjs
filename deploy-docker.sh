#!/bin/bash

# Docker Deployment script for CRM Frontend
# Deploys to /opt on the server

set -e

SSH_KEY="C:\Users\Shubham\.ssh\ssh-key.key"
SERVER_USER="root"
SERVER_IP="91.98.235.142"
SERVER_PATH="/opt/crm-frontend"
DOCKER_IMAGE="crm-frontend:latest"
CONTAINER_NAME="crm-frontend"

echo "🚀 Starting Docker Deployment for CRM Frontend..."

# Step 1: Build Docker image locally
echo "📦 Building Docker image..."
docker build -t $DOCKER_IMAGE .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed!"
    exit 1
fi

echo "✅ Docker image built successfully"

# Step 2: Save image and transfer to server
echo "💾 Saving Docker image..."
docker save $DOCKER_IMAGE | gzip > crm-frontend.tar.gz

echo "📤 Uploading Docker image to server..."
scp -i "$SSH_KEY" crm-frontend.tar.gz $SERVER_USER@$SERVER_IP:$SERVER_PATH/

# Step 3: Load image and start container on server
echo "🔧 Loading image and starting container on server..."
ssh -i "$SSH_KEY" $SERVER_USER@$SERVER_IP << 'DEPLOY'
cd /opt/crm-frontend

# Load Docker image
docker load < crm-frontend.tar.gz

# Stop and remove existing container
docker stop crm-frontend 2>/dev/null || true
docker rm crm-frontend 2>/dev/null || true

# Start new container
docker run -d \
  --name crm-frontend \
  --restart always \
  -p 3000:3000 \
  crm-frontend:latest

echo "✅ Container started successfully"
docker ps | grep crm-frontend

DEPLOY

# Cleanup
rm crm-frontend.tar.gz

echo "✅ Deployment completed successfully!"
echo "🌐 Your CRM frontend is now live at http://91.98.235.142:3000"
