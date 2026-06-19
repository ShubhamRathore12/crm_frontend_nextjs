#!/bin/bash
set -e

echo "==============================================="
echo "CRM Frontend Deployment Script"
echo "==============================================="
echo ""

DEPLOY_PATH="/opt/crm-frontend"
IMAGE_NAME="crm-frontend:latest"
CONTAINER_NAME="crm-frontend"
PORT="3005"
NETWORK="primeosys-network"

echo "📍 Deployment Path: $DEPLOY_PATH"
echo "📦 Image Name: $IMAGE_NAME"
echo "🐳 Container Name: $CONTAINER_NAME"
echo "🔌 Port: $PORT"
echo ""

# Step 1: Navigate to deployment directory
echo "Step 1: Navigating to deployment directory..."
cd $DEPLOY_PATH
echo "✅ Directory: $(pwd)"
echo ""

# Step 2: Check if Dockerfile exists
echo "Step 2: Checking Dockerfile..."
if [ ! -f "Dockerfile" ]; then
    echo "❌ Error: Dockerfile not found in $DEPLOY_PATH"
    exit 1
fi
echo "✅ Dockerfile found"
echo ""

# Step 3: Check dependencies
echo "Step 3: Checking dependencies..."
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker not installed"
    exit 1
fi
echo "✅ Docker installed: $(docker --version)"
echo ""

# Step 4: Build Docker image
echo "Step 4: Building Docker image..."
echo "   This may take a few minutes..."
docker build -t $IMAGE_NAME .
if [ $? -ne 0 ]; then
    echo "❌ Error: Docker build failed"
    exit 1
fi
echo "✅ Docker image built successfully"
echo ""

# Step 5: Stop existing container
echo "Step 5: Stopping existing container..."
docker stop $CONTAINER_NAME 2>/dev/null || echo "   (No existing container)"
docker rm $CONTAINER_NAME 2>/dev/null || echo "   (Container removed)"
echo "✅ Old container cleaned up"
echo ""

# Step 6: Start new container
echo "Step 6: Starting new container..."
docker run -d \
  --name $CONTAINER_NAME \
  -p $PORT:3005 \
  --network $NETWORK \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_BASE_PATH=/crm \
  -e NEXT_PUBLIC_API_URL=/backend \
  --restart unless-stopped \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  --health-start-period=40s \
  $IMAGE_NAME

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to start container"
    exit 1
fi
echo "✅ Container started"
echo ""

# Step 7: Wait for container to be ready
echo "Step 7: Waiting for container to be ready..."
sleep 3
for i in {1..30}; do
    if docker inspect $CONTAINER_NAME --format='{{.State.Running}}' 2>/dev/null | grep -q "true"; then
        echo "✅ Container is running"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Error: Container failed to start"
        docker logs $CONTAINER_NAME
        exit 1
    fi
    echo "   Waiting... ($i/30)"
    sleep 1
done
echo ""

# Step 8: Verify deployment
echo "Step 8: Verifying deployment..."
echo ""
echo "🔍 Container Status:"
docker ps | grep $CONTAINER_NAME || echo "   (Container not found)"
echo ""

echo "📋 Container Logs (last 10 lines):"
docker logs $CONTAINER_NAME --tail 10
echo ""

echo "🌐 Testing application..."
if curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:$PORT/crm; then
    echo "✅ Application is responding"
else
    echo "⚠️  Could not reach application at http://localhost:$PORT/crm"
fi
echo ""

# Final summary
echo "==============================================="
echo "✅ Deployment Completed Successfully!"
echo "==============================================="
echo ""
echo "📊 Deployment Summary:"
echo "   • Image: $IMAGE_NAME"
echo "   • Container: $CONTAINER_NAME"
echo "   • Port: $PORT"
echo "   • URL: https://primeosys.com/crm"
echo ""
echo "🔧 Useful Commands:"
echo "   • View logs: docker logs $CONTAINER_NAME -f"
echo "   • Restart: docker restart $CONTAINER_NAME"
echo "   • Stop: docker stop $CONTAINER_NAME"
echo "   • Status: docker ps | grep $CONTAINER_NAME"
echo ""
echo "✅ Done!"
