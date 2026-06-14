# CRM Frontend Deployment Guide

## Prerequisites

- SSH access to server: `91.98.235.142`
- SSH key: `C:\Users\Shubham\.ssh\ssh-key.key`
- Docker installed on server
- Nginx configured to proxy `/crm/` to port 3005

## Quick Deploy

### 1. SSH into Server

```bash
ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142
```

### 2. Navigate to Project Directory

```bash
cd /app/crm-frontend
```

### 3. Build Docker Image

```bash
docker build -t crm-frontend:latest .
```

### 4. Stop Old Container (if exists)

```bash
docker stop crm-frontend 2>/dev/null
docker rm crm-frontend 2>/dev/null
```

### 5. Run New Container

```bash
docker run -d \
  --name crm-frontend \
  --restart unless-stopped \
  -p 3005:3005 \
  crm-frontend:latest
```

### 6. Verify Deployment

```bash
# Check container is running
docker ps | grep crm-frontend

# Test the app locally
curl http://localhost:3005/login

# Test through nginx (public URL)
curl https://primeosys.com/crm/login
```

## Full Deployment Steps (From Windows)

### Step 1: Copy Updated Code to Server

```bash
# Sync app directory
scp -i C:\Users\Shubham\.ssh\ssh-key.key -r "d:\new_project\new_hmi\crm\frontend\app" root@91.98.235.142:/app/crm-frontend/

# Sync components
scp -i C:\Users\Shubham\.ssh\ssh-key.key -r "d:\new_project\new_hmi\crm\frontend\components" root@91.98.235.142:/app/crm-frontend/

# Sync lib directory
scp -i C:\Users\Shubham\.ssh\ssh-key.key -r "d:\new_project\new_hmi\crm\frontend\lib" root@91.98.235.142:/app/crm-frontend/

# Copy package.json
scp -i C:\Users\Shubham\.ssh\ssh-key.key "d:\new_project\new_hmi\crm\frontend\package.json" root@91.98.235.142:/app/crm-frontend/

# Copy Dockerfile
scp -i C:\Users\Shubham\.ssh\ssh-key.key "d:\new_project\new_hmi\crm\frontend\Dockerfile" root@91.98.235.142:/app/crm-frontend/
```

### Step 2: Build & Deploy on Server

SSH into the server and run:

```bash
cd /app/crm-frontend

# Stop old container
docker stop crm-frontend 2>/dev/null && docker rm crm-frontend 2>/dev/null

# Build new image
docker build -t crm-frontend:latest .

# Run new container
docker run -d \
  --name crm-frontend \
  --restart unless-stopped \
  -p 3005:3005 \
  crm-frontend:latest

# Wait 10 seconds for startup
sleep 10

# Verify
docker ps | grep crm-frontend
curl http://localhost:3005/login
```

## One-Line Deploy Script

SSH into server and run this single command:

```bash
cd /app/crm-frontend && \
docker stop crm-frontend 2>/dev/null && \
docker rm crm-frontend 2>/dev/null && \
docker build -t crm-frontend:latest . && \
docker run -d --name crm-frontend --restart unless-stopped -p 3005:3005 crm-frontend:latest && \
sleep 5 && \
echo "Deployment complete!" && \
docker ps | grep crm-frontend
```

## Environment Variables

The app uses these environment variables (set in Dockerfile):

```dockerfile
ENV NODE_ENV=production
ENV PORT=3005
ENV HOSTNAME="0.0.0.0"
ENV NEXT_PUBLIC_API_BASE=https://primeosys.com/crm-backend
ENV NEXT_PUBLIC_BASE_PATH=/crm
```

To override at runtime, modify the `docker run` command:

```bash
docker run -d \
  --name crm-frontend \
  --restart unless-stopped \
  -p 3005:3005 \
  -e NEXT_PUBLIC_API_BASE=https://your-api.com/crm-backend \
  crm-frontend:latest
```

## Checking Logs

```bash
# View container logs
docker logs crm-frontend

# Follow logs in real-time
docker logs -f crm-frontend

# Last 50 lines
docker logs --tail 50 crm-frontend
```

## Troubleshooting

### Container not starting?

```bash
docker logs crm-frontend
```

### Port 3005 already in use?

```bash
# Find what's using port 3005
ss -tlnp | grep 3005

# Kill it if needed
fuser -k 3005/tcp
```

### Need to restart container?

```bash
docker restart crm-frontend
```

### Check if nginx is proxying correctly?

```bash
# Check nginx config
cat /etc/nginx/sites-enabled/primeosys.com | grep -A10 "location /crm/"

# Reload nginx if needed
nginx -t && nginx -s reload
```

## Deployment Checklist

- [ ] Code changes committed and pushed
- [ ] Copy code to server via SCP
- [ ] SSH into server
- [ ] Stop old container
- [ ] Build new image
- [ ] Start new container
- [ ] Test `https://primeosys.com/crm/login` returns 200
- [ ] Test `https://primeosys.com/crm/dashboard` returns 200
- [ ] Check `docker logs crm-frontend` for errors

## Server Details

- **Server IP**: `91.98.235.142`
- **App Port**: `3005` (internal)
- **Public URL**: `https://primeosys.com/crm/`
- **SSH Key**: `C:\Users\Shubham\.ssh\ssh-key.key`
- **Project Directory**: `/app/crm-frontend`
- **Docker Image**: `crm-frontend:latest`
- **API Backend**: `https://primeosys.com/crm-backend`
- **Other Services**: 
  - `indiamart-server` (PM2) — Do not touch
  - CRM backend services (Docker) — Running on port 4200
