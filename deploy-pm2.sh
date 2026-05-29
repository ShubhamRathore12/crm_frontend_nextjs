#!/bin/bash

# Deployment script with PM2 process management
SSH_KEY="C:\Users\Shubham\.ssh\ssh-key.key"
SERVER_USER="root"
SERVER_IP="91.98.235.142"
SERVER_PATH="/app/crm-frontend"

echo "🚀 Deploying CRM Frontend with PM2..."

# SSH into server and setup PM2
ssh -i "$SSH_KEY" $SERVER_USER@$SERVER_IP << 'EOF'
cd /app/crm-frontend

# Install PM2 globally if not already installed
npm install -g pm2

# Stop existing process
pm2 stop crm-frontend 2>/dev/null || true
pm2 delete crm-frontend 2>/dev/null || true

# Start with PM2
pm2 start npm --name "crm-frontend" -- run start

# Save PM2 config
pm2 save

# Setup PM2 to start on boot
pm2 startup

echo "✅ Application started with PM2"
pm2 list
EOF

echo "✅ Deployment completed!"
echo "🌐 Your CRM frontend is now live at http://91.98.235.142:3000"
