# CRM Frontend Deployment Guide

## 📋 Prerequisites

- Docker installed on local machine
- SSH access to server (91.98.235.142)
- SSH key at `C:\Users\Shubham\.ssh\ssh-key.key`
- Docker installed on server

## 🚀 Deployment Steps

### Step 1: Build Optimized Docker Image

```bash
# Navigate to frontend directory
cd d:\new_project\new_hmi\crm\frontend

# Build the optimized image
docker build -t crm-frontend:latest --compress -f Dockerfile .

# Check image size
docker images crm-frontend:latest
```

**Expected image size**: ~200-250MB (optimized from ~400MB)

### Step 2: Verify Image Works Locally

```bash
# Run container locally
docker run -p 3001:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_BASE_PATH=/crm \
  -e NEXT_PUBLIC_API_BASE=https://primeosys.com/crm-backend \
  crm-frontend:latest

# Test in browser
# Visit: http://localhost:3001/crm
```

### Step 3: Deploy to Server

#### Option A: Using Deploy Script (Recommended)

```bash
# Make script executable
chmod +x deploy.sh

# Run deployment script
./deploy.sh
```

#### Option B: Manual Deployment

```bash
# Step 1: Create deployment directory on server
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 "mkdir -p /opt/crm-frontend"

# Step 2: Save Docker image
docker save crm-frontend:latest | gzip > crm-frontend.tar.gz

# Step 3: Transfer image to server
scp -i "C:\Users\Shubham\.ssh\ssh-key.key" crm-frontend.tar.gz root@91.98.235.142:/opt/crm-frontend/

# Step 4: Transfer docker-compose file
scp -i "C:\Users\Shubham\.ssh\ssh-key.key" docker-compose.yml root@91.98.235.142:/opt/crm-frontend/

# Step 5: Load image and start container on server
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 << 'EOF'
  cd /opt/crm-frontend
  
  # Load Docker image
  docker load < crm-frontend.tar.gz
  
  # Stop existing container
  docker stop crm-frontend 2>/dev/null || true
  docker rm crm-frontend 2>/dev/null || true
  
  # Start new container
  docker-compose up -d
  
  # Wait for container to be healthy
  sleep 5
  
  # Check status
  docker ps | grep crm-frontend
  
  # Clean up
  rm crm-frontend.tar.gz
EOF

# Step 6: Clean up local tar file
rm crm-frontend.tar.gz
```

### Step 4: Verify Deployment

```bash
# Check container is running
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 "docker ps | grep crm-frontend"

# Check logs
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 "docker logs crm-frontend"

# Test health endpoint
curl https://primeosys.com/crm/health

# Test in browser
# Visit: https://primeosys.com/crm
```

## 🐳 Docker Image Optimization

### Size Reduction Techniques Applied

1. **Multi-stage builds**: Only production files copied to final image
2. **Alpine Linux**: Lightweight base image (~5MB vs ~150MB)
3. **Dependency caching**: Layers optimized for Docker cache
4. **Cleanup**: Removed build artifacts and cache
5. **Compression**: Used `--compress` flag during build

### Image Size Comparison

| Stage | Size | Notes |
|-------|------|-------|
| deps | ~150MB | Node modules |
| builder | ~400MB | Full build with source |
| runner | ~200-250MB | **Final optimized image** |

### Size Breakdown

```
crm-frontend:latest
├── Node.js runtime: ~50MB
├── Next.js standalone: ~80MB
├── Application code: ~30MB
├── Static assets: ~20MB
└── System files: ~20-70MB
```

## 🔧 Configuration

### Environment Variables

```bash
NODE_ENV=production
NEXT_PUBLIC_BASE_PATH=/crm
NEXT_PUBLIC_API_BASE=https://primeosys.com/crm-backend
```

### Resource Limits

```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 512M
    reservations:
      cpus: '0.5'
      memory: 256M
```

### Health Check

```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
  interval: 30s
  timeout: 3s
  retries: 3
  start_period: 5s
```

## 📊 Deployment Checklist

- [ ] Docker image builds successfully
- [ ] Image size is ~200-250MB
- [ ] Container runs locally without errors
- [ ] Health check passes
- [ ] SSH access to server works
- [ ] Deployment directory created on server
- [ ] Docker image transferred to server
- [ ] Container starts on server
- [ ] Health check passes on server
- [ ] URL accessible: https://primeosys.com/crm
- [ ] API calls work correctly
- [ ] Performance optimizations active

## 🚨 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs crm-frontend

# Check if port is in use
docker ps -a | grep 3001

# Remove old container
docker rm -f crm-frontend
```

### Health Check Failing

```bash
# Test health endpoint manually
docker exec crm-frontend wget -O- http://localhost:3000/health

# Check if application is running
docker exec crm-frontend ps aux | grep node
```

### High Memory Usage

```bash
# Check memory usage
docker stats crm-frontend

# Reduce memory limit in docker-compose.yml
# Restart container
docker-compose restart
```

### Nginx Proxy Issues

```bash
# Check nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

## 📈 Monitoring

### Check Container Status

```bash
# View running containers
docker ps

# View container logs
docker logs -f crm-frontend

# View resource usage
docker stats crm-frontend

# View container details
docker inspect crm-frontend
```

### Performance Metrics

```bash
# Check application performance
curl https://primeosys.com/crm/test-optimizations

# Monitor API calls
curl https://primeosys.com/crm-backend/api/v1/health
```

## 🔄 Updates & Rollback

### Update to New Version

```bash
# Build new image
docker build -t crm-frontend:latest .

# Save and transfer
docker save crm-frontend:latest | gzip > crm-frontend.tar.gz
scp crm-frontend.tar.gz root@91.98.235.142:/opt/crm-frontend/

# On server
ssh root@91.98.235.142 << 'EOF'
  cd /opt/crm-frontend
  docker load < crm-frontend.tar.gz
  docker-compose up -d
EOF
```

### Rollback to Previous Version

```bash
# On server
ssh root@91.98.235.142 << 'EOF'
  cd /opt/crm-frontend
  
  # Stop current container
  docker stop crm-frontend
  
  # Start previous version (if tagged)
  docker run -d --name crm-frontend-old crm-frontend:previous
  
  # Or restore from backup
  docker load < crm-frontend-backup.tar.gz
  docker-compose up -d
EOF
```

## 📝 Maintenance

### Regular Tasks

1. **Weekly**: Check logs for errors
2. **Monthly**: Update dependencies
3. **Quarterly**: Review performance metrics
4. **Annually**: Security audit

### Cleanup

```bash
# Remove unused images
docker image prune -a

# Remove unused containers
docker container prune

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune
```

## 🎉 Deployment Complete!

Once deployed, the CRM frontend will be available at:
- **URL**: https://primeosys.com/crm
- **API**: https://primeosys.com/crm-backend
- **Test Page**: https://primeosys.com/crm/test-optimizations

## 📞 Support

For issues or questions:
1. Check container logs: `docker logs crm-frontend`
2. Review this guide
3. Check nginx configuration
4. Verify API connectivity