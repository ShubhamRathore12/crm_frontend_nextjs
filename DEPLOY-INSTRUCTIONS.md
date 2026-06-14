# 🚀 CRM Frontend Deployment Instructions

## Quick Deploy to Production (91.98.235.142)

### Prerequisites ✅
- SSH key at: `C:\Users\Shubham\.ssh\ssh-key.key`
- Docker installed locally
- Git Bash or WSL (for bash commands) or use Docker Desktop
- npm/Node.js installed

---

## Step 1: Build the Application

```bash
npm run build
```

Expected: Build completes without errors

---

## Step 2: Build Docker Image

```bash
docker build -t crm-frontend:latest --compress -f Dockerfile .
```

Expected: Image size ~200-250MB

---

## Step 3: Save Docker Image

```bash
docker save crm-frontend:latest | gzip > crm-frontend.tar.gz
```

Expected: Creates `crm-frontend.tar.gz` (~100-150MB)

---

## Step 4: Deploy to Server

### Using Git Bash or WSL:

```bash
# Transfer Docker image
scp -i C:\Users\Shubham\.ssh\ssh-key.key crm-frontend.tar.gz root@91.98.235.142:/tmp/

# Transfer docker-compose and nginx config
scp -i C:\Users\Shubham\.ssh\ssh-key.key docker-compose.yml root@91.98.235.142:/app/crm-frontend/
scp -i C:\Users\Shubham\.ssh\ssh-key.key nginx-crm.conf root@91.98.235.142:/app/crm-frontend/

# Execute deployment on server
ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 << 'EOF'
cd /app/crm-frontend

# Load Docker image
echo "📦 Loading Docker image..."
docker load < /tmp/crm-frontend.tar.gz

# Stop existing container
echo "🛑 Stopping existing container..."
docker stop crm-frontend 2>/dev/null || true
docker rm crm-frontend 2>/dev/null || true

# Start new container
echo "🚀 Starting new container..."
docker-compose up -d

# Wait and verify
sleep 10
echo "✅ Container status:"
docker ps | grep crm-frontend

# Cleanup
rm /tmp/crm-frontend.tar.gz
EOF

# Verify deployment
echo "✅ Deployment complete!"
echo "🌐 Access at: http://91.98.235.142/crm"
echo "📝 Or with domain: https://primeosys.com/crm"
```

---

## Step 5: Verify Deployment

### Check Container Status:
```bash
ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 "docker ps | grep crm-frontend"
```

### View Logs:
```bash
ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 "docker logs crm-frontend"
```

### Test Health:
```bash
ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 "wget -O- http://localhost:3005/crm"
```

---

## Environment Configuration

The following are already configured in `docker-compose.yml`:

```yaml
services:
  web:
    container_name: crm-frontend
    ports:
      - "3005:3005"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=/backend
    networks:
      - primeosys-network  # Connects to existing network
```

**Key Points:**
- ✅ Runs on port 3005 (mapped to container port 3005)
- ✅ Uses `primeosys-network` (preserves other projects)
- ✅ Configured for `/crm` base path
- ✅ Auto-restart enabled
- ✅ Health checks enabled

---

## Nginx Configuration

The frontend is accessed via Nginx reverse proxy:

**Location**: `/crm`  
**Proxy to**: `http://localhost:3005/crm`

Configure Nginx on the server:

```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name 91.98.235.142 primeosys.com;

    location /crm {
        proxy_pass http://localhost:3005;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## Troubleshooting

### Container Won't Start

```bash
ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 << 'EOF'
# Check what's running on port 3005
netstat -tlnp | grep 3005

# Force remove old container
docker rm -f crm-frontend

# Check Docker daemon
docker ps

# View Docker logs
journalctl -u docker -n 50
EOF
```

### Health Check Failing

```bash
ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 << 'EOF'
# Test health endpoint directly
docker exec crm-frontend wget -O- http://localhost:3005/crm || echo "Failed"

# Check if Next.js is running
docker exec crm-frontend ps aux | grep node
EOF
```

### Network Issues

```bash
ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 << 'EOF'
# Verify network exists
docker network ls | grep primeosys-network

# Inspect network
docker network inspect primeosys-network

# If network doesn't exist, create it
docker network create primeosys-network
EOF
```

### High Memory Usage

The docker-compose limits container to:
- Max: 512MB
- Reserved: 256MB

If still high, check logs and optimize.

---

## Rollback Steps

Keep backup of previous image:

```bash
# On server before deploying new version
docker tag crm-frontend:latest crm-frontend:backup

# To rollback:
docker stop crm-frontend
docker rm crm-frontend
docker tag crm-frontend:backup crm-frontend:latest
docker-compose up -d
```

---

## Project Structure (Preserved)

All existing projects remain intact:

```
/app/
├── crm-backend/          (unchanged)
├── crm-frontend/         (NEW - this deployment)
├── other-service-1/      (unchanged)
├── other-service-2/      (unchanged)
└── ...
```

The CRM frontend is isolated in its own container and network namespace.

---

## Next.js Configuration

The Next.js app is configured for `/crm` path:

**next.config.ts:**
```typescript
const nextConfig = {
  basePath: "/crm",
  assetPrefix: "/crm",
  output: "standalone",
  // ...
}
```

This ensures:
- ✅ All routes work under `/crm/` (e.g., `/crm/contacts`, `/crm/leads`)
- ✅ Static assets load from `/crm/` (CSS, JS, images)
- ✅ API calls routed correctly
- ✅ No conflicts with other `/` based services

---

## Monitoring & Logs

### Real-time Logs:
```bash
ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 "docker logs -f crm-frontend"
```

### Last 100 lines:
```bash
ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 "docker logs --tail 100 crm-frontend"
```

### Container Stats:
```bash
ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 "docker stats crm-frontend"
```

---

## Quick Commands Reference

```bash
# SSH to server
ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142

# Check if running
ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 "docker ps | grep crm"

# Restart container
ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 "cd /app/crm-frontend && docker-compose restart"

# Stop container
ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 "docker stop crm-frontend"

# Start container
ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 "cd /app/crm-frontend && docker-compose up -d"
```

---

## ✅ Success Checklist

- [ ] Build succeeds: `npm run build`
- [ ] Docker image builds: `docker build -t crm-frontend:latest .`
- [ ] Image saved: `crm-frontend.tar.gz` created
- [ ] SSH access works: `ssh -i <key> root@91.98.235.142`
- [ ] Files transferred to server
- [ ] Container started: `docker ps | grep crm-frontend`
- [ ] Health check passing
- [ ] Access works: `http://91.98.235.142/crm`
- [ ] API calls working
- [ ] No port conflicts
- [ ] Logs clean: `docker logs crm-frontend`

---

## Support

For issues:
1. Check logs: `docker logs crm-frontend`
2. Review this guide
3. Check server resources: `docker stats`
4. Verify network: `docker network inspect primeosys-network`
5. Review nginx config if using reverse proxy

**Contact**: Check logs and error messages for specific issues.
