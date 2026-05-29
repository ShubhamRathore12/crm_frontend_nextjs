#!/bin/bash

# Deployment script for CRM Frontend
# This script builds and deploys the Next.js frontend to the production server

set -e

echo "🚀 Starting CRM Frontend Deployment..."

# Configuration
SSH_KEY="C:\Users\Shubham\.ssh\ssh-key.key"
SERVER_USER="root"
SERVER_IP="91.98.235.142"
SERVER_PATH="/app/crm-frontend"
REMOTE_CMD="ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP"

# Step 1: Build the application
echo "📦 Building Next.js application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build completed successfully"

# Step 2: Create deployment directory on server
echo "📁 Creating deployment directory on server..."
$REMOTE_CMD "mkdir -p $SERVER_PATH"

# Step 3: Deploy files
echo "📤 Uploading files to server..."

# Using rsync for efficient file transfer
rsync -avz -e "ssh -i $SSH_KEY" \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.env.local' \
    --exclude='*.log' \
    ./ $SERVER_USER@$SERVER_IP:$SERVER_PATH/

# Step 4: Copy built files
echo "📤 Uploading built files..."
rsync -avz -e "ssh -i $SSH_KEY" \
    .next/ $SERVER_USER@$SERVER_IP:$SERVER_PATH/.next/

# Step 5: Install dependencies and start
echo "🔧 Installing dependencies and starting application..."
$REMOTE_CMD "cd $SERVER_PATH && npm install --production && npm run start"

echo "✅ Deployment completed successfully!"
echo "🌐 Your CRM frontend is now live at http://91.98.235.142"
