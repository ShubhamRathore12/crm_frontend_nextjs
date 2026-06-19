# CRM Frontend Deployment Guide

## Quick Deployment (One Command)

```bash
ssh -i /path/to/ssh-key root@91.98.235.142 "cd /opt/crm-frontend && bash deploy.sh"
```

## Manual Steps (if needed)

```bash
# 1. Connect to server
ssh -i /path/to/ssh-key root@91.98.235.142

# 2. Navigate to deployment directory
cd /opt/crm-frontend

# 3. Pull latest code
git pull origin main

# 4. Build Docker image
docker build -t crm-frontend:latest .

# 5. Stop old container
docker stop crm-frontend 2>/dev/null || true
docker rm crm-frontend 2>/dev/null || true

# 6. Start new container
docker run -d \
  --name crm-frontend \
  -p 3005:3005 \
  --network primeosys-network \
  -e NODE_ENV=production \
  --restart unless-stopped \
  crm-frontend:latest

# 7. Check status
docker ps | grep crm-frontend
```

## Server Details
- **Host**: 91.98.235.142
- **User**: root
- **Port**: 3005
- **URL**: https://primeosys.com/crm
- **Container Network**: primeosys-network

## Docker Commands

```bash
# View logs
docker logs crm-frontend -f

# Restart container
docker restart crm-frontend

# Stop container
docker stop crm-frontend

# Remove container
docker rm crm-frontend

# View container details
docker inspect crm-frontend
```
