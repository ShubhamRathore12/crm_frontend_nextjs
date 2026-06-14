# Server Setup Complete ✓

## Status: DEPLOYMENT READY

Your server `root@91.98.235.142` is now configured for safe CRM frontend deployment.

### What Was Configured

✓ **Deployment Directory**: `/home/deploy/crm-frontend`  
✓ **Backup Directory**: `/home/deploy/crm-frontend-backup`  
✓ **Docker Network**: `primeosys-network` (created and ready)  
✓ **Port 3005**: Available and reserved for CRM  
✓ **Health Check Script**: `/usr/local/bin/crm-health-check`  
✓ **Deploy Script**: `/usr/local/bin/crm-deploy`  

### Current Server Status

**Running Containers (NOT AFFECTED):**
- `grain-backend` - Up 38 hours (healthy)
- `machine-config-service` - Up 4 days (healthy)
- `myshaa-phpmyadmin` - Up 2 weeks
- `myshaa-mysql57` - Up 2 weeks

✓ All existing services remain untouched and operational

---

## Quick Deploy Commands

### 1. Clone Your Repository

```bash
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "cd /home/deploy/crm-frontend && git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git ."
```

### 2. Create Environment File

```bash
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "cat > /home/deploy/crm-frontend/.env.production << 'ENVEOF'
NODE_ENV=production
NEXT_PUBLIC_API_URL=/backend
PORT=3005
ENVEOF"
```

### 3. Copy Docker Files

```bash
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "mkdir -p /home/deploy/crm-frontend"
```

Then copy these files to the server:
- `Dockerfile` → `/home/deploy/crm-frontend/Dockerfile`
- `docker-compose.yml` → `/home/deploy/crm-frontend/docker-compose.yml`

### 4. Deploy

```bash
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "/usr/local/bin/crm-deploy"
```

---

## Monitoring Commands

### Check Deployment Status
```bash
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "docker ps | grep crm"
```

### View Logs
```bash
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "docker logs -f crm-frontend"
```

### Run Health Check
```bash
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "/usr/local/bin/crm-health-check"
```

### Check All Containers
```bash
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "docker ps -a"
```

---

## Nginx Configuration

The updated nginx config at `deploy/primeosys-nginx.conf`:
- Routes `/crm/` → `http://127.0.0.1:3005/` (no server name in path)
- Caches static assets at `/crm/_next/static` for 1 year
- Proxies `/crm/api/` calls to backend

**Deployment path**: `https://primeosys.com/crm/`

---

## Deployment Workflow

When you push to GitHub, the automated workflow:
1. ✓ Builds your Next.js app
2. ✓ Creates Docker image
3. ✓ Pushes to GitHub Container Registry
4. ✓ SSH into your server
5. ✓ Pulls latest code
6. ✓ Rebuilds container
7. ✓ Performs health checks
8. ✓ Tests endpoint
9. ✓ Auto-rollbacks on failure

---

## Directory Structure on Server

```
/home/deploy/
├── crm-frontend/              # Current deployment
│   ├── app/
│   ├── components/
│   ├── public/
│   ├── .git/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── package.json
│   ├── .env.production
│   └── ...
├── crm-frontend-backup/       # Automatic backup
└── logs/                       # Log directory
```

---

## Troubleshooting

### Container Won't Start
```bash
# Check Docker logs
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "docker logs crm-frontend"

# Check available disk space
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "df -h"

# Check memory
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "free -h"
```

### Port Already in Use
```bash
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "ss -tlnp | grep 3005"
```

### Rollback to Previous Version
```bash
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "cd /home/deploy/crm-frontend-backup && docker-compose up -d"
```

---

## Security Notes

- SSH key: `/root/.ssh/authorized_keys` configured
- Deployment user: `deploy` created and added to docker group
- Network: Isolated `primeosys-network`
- Port 3005: Only accessible internally via nginx proxy
- External access: Only through nginx at `/crm/`

---

## What's Next?

1. **Push to GitHub** - Creates deployment workflow
2. **Add GitHub Secrets**:
   - `SERVER_HOST`: 91.98.235.142
   - `SERVER_USER`: root
   - `SERVER_SSH_KEY`: Your SSH private key content
   - `SERVER_PORT`: 22

3. **Clone repository** to server
4. **Create .env.production**
5. **Run `/usr/local/bin/crm-deploy`**
6. **Test** at `https://primeosys.com/crm/`

---

## Support

For logs and debugging:
- Application logs: `docker logs crm-frontend`
- Docker compose logs: `docker-compose logs -f`
- Nginx logs: `/var/log/nginx/access.log`

All setup is complete. Your deployment environment is isolated, safe, and ready for production!

**Server Status**: ✓ READY
**Existing Services**: ✓ SAFE
**CRM Frontend**: ✓ READY TO DEPLOY
