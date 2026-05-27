#!/bin/bash

# CRM Frontend Deployment Script - Runs on Server
# This script builds and deploys the CRM frontend directly on the server

set -e

DEPLOY_PATH="/opt/crm-frontend"
DOCKER_IMAGE="crm-frontend:latest"
DOCKER_CONTAINER="crm-frontend"

echo ""
echo "🚀 CRM Frontend Deployment Script (Server-side)"
echo "=============================================="
echo ""

# Step 1: Navigate to deployment directory
echo "📂 Step 1: Setting up deployment directory..."
cd $DEPLOY_PATH
echo "✅ Working directory: $(pwd)"
echo ""

# Step 2: Clone or copy source code
echo "📥 Step 2: Preparing source code..."
if [ ! -d "source" ]; then
    mkdir -p source
fi
echo "✅ Source directory ready"
echo ""

# Step 3: Build Docker image on server
echo "🔨 Step 3: Building Docker image on server..."
docker build -t $DOCKER_IMAGE --compress -f Dockerfile ./source
IMAGE_SIZE=$(docker images --format "{{.Size}}" $DOCKER_IMAGE)
echo "✅ Docker image built successfully"
echo "   Image size: $IMAGE_SIZE"
echo ""

# Step 4: Stop and remove old container
echo "🛑 Step 4: Stopping old container..."
docker stop $DOCKER_CONTAINER 2>/dev/null || true
docker rm $DOCKER_CONTAINER 2>/dev/null || true
echo "✅ Old container removed"
echo ""

# Step 5: Start new container
echo "🚀 Step 5: Starting new container..."
docker-compose up -d
sleep 5
echo "✅ Container started"
echo ""

# Step 6: Verify deployment
echo "✅ Step 6: Verifying deployment..."
docker ps | grep $DOCKER_CONTAINER
echo ""

# Step 7: Check health
echo "🏥 Step 7: Checking container health..."
HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' $DOCKER_CONTAINER 2>/dev/null || echo "unknown")
echo "   Health status: $HEALTH_STATUS"
echo ""

# Summary
echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Deployment Summary:"
echo "   - Container: $DOCKER_CONTAINER"
echo "   - Image: $DOCKER_IMAGE"
echo "   - Image size: $IMAGE_SIZE"
echo "   - Deploy path: $DEPLOY_PATH"
echo "   - URL: https://primeosys.com/crm"
echo ""

echo "🔍 Verify deployment:"
echo "   - Check container: docker ps"
echo "   - View logs: docker logs $DOCKER_CONTAINER"
echo "   - Test URL: https://primeosys.com/crm"
echo ""

echo "🎉 Done!"
echo ""