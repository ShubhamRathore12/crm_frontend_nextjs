#!/bin/bash

# CRM Frontend Deployment Script
# This script builds and deploys the optimized CRM frontend to the server

set -e

# Configuration
SERVER_IP="91.98.235.142"
SERVER_USER="root"
SSH_KEY="C:\Users\Shubham\.ssh\ssh-key.key"
DEPLOY_PATH="/opt/crm-frontend"
DOCKER_IMAGE="crm-frontend:latest"
DOCKER_CONTAINER="crm-frontend"
REGISTRY_URL="primeosys.com"

echo "🚀 CRM Frontend Deployment Script"
echo "=================================="
echo ""

# Step 1: Build Docker image
echo "📦 Step 1: Building optimized Docker image..."
docker build -t $DOCKER_IMAGE \
  --build-arg NODE_ENV=production \
  --compress \
  -f Dockerfile .

# Get image size
IMAGE_SIZE=$(docker images --format "{{.Size}}" $DOCKER_IMAGE)
echo "✅ Docker image built successfully"
echo "   Image size: $IMAGE_SIZE"
echo ""

# Step 2: Tag image for registry
echo "🏷️  Step 2: Tagging image for registry..."
docker tag $DOCKER_IMAGE $REGISTRY_URL/$DOCKER_IMAGE
echo "✅ Image tagged successfully"
echo ""

# Step 3: Push to registry (optional)
echo "📤 Step 3: Pushing image to registry (optional)..."
# Uncomment if you have a registry
# docker push $REGISTRY_URL/$DOCKER_IMAGE
echo "⏭️  Skipped (configure registry if needed)"
echo ""

# Step 4: Deploy to server
echo "🌐 Step 4: Deploying to server..."
echo "   Server: $SERVER_IP"
echo "   Deploy path: $DEPLOY_PATH"
echo ""

# Create deployment directory
ssh -i "$SSH_KEY" $SERVER_USER@$SERVER_IP "mkdir -p $DEPLOY_PATH"

# Copy docker-compose file
scp -i "$SSH_KEY" docker-compose.yml $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/

# Copy nginx config
scp -i "$SSH_KEY" nginx.conf $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/

# Save image as tar and transfer
echo "📦 Saving Docker image..."
docker save $DOCKER_IMAGE | gzip > crm-frontend.tar.gz

echo "📤 Transferring image to server..."
scp -i "$SSH_KEY" crm-frontend.tar.gz $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/

# Load image on server and start container
echo "🔄 Loading image and starting container on server..."
ssh -i "$SSH_KEY" $SERVER_USER@$SERVER_IP << 'EOF'
  cd /opt/crm-frontend
  
  # Load Docker image
  docker load < crm-frontend.tar.gz
  
  # Stop existing container if running
  docker stop crm-frontend 2>/dev/null || true
  docker rm crm-frontend 2>/dev/null || true
  
  # Start new container with docker-compose
  docker-compose up -d
  
  # Wait for container to be healthy
  sleep 5
  
  # Check container status
  docker ps | grep crm-frontend
  
  # Clean up tar file
  rm crm-frontend.tar.gz
  
  echo "✅ Container started successfully"
EOF

# Clean up local tar file
rm crm-frontend.tar.gz

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Deployment Summary:"
echo "   - Docker image size: $IMAGE_SIZE"
echo "   - Server: $SERVER_IP"
echo "   - Container: $DOCKER_CONTAINER"
echo "   - URL: https://primeosys.com/crm"
echo ""
echo "🔍 Verify deployment:"
echo "   - Check container: docker ps"
echo "   - View logs: docker logs crm-frontend"
echo "   - Test URL: https://primeosys.com/crm"
echo ""
echo "🎉 Done!"