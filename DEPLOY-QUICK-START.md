# 🚀 Quick Deploy Guide - CRM Frontend

**Target**: `root@91.98.235.142:/app/crm-frontend`  
**Access**: `http://91.98.235.142/crm` or `https://primeosys.com/crm`

---

## ⚡ TL;DR - 3 Steps

### Step 1: Prepare & Build (on your machine)
```bash
cd d:\new_project\new_hmi\crm\frontend
npm run build
docker build -t crm-frontend:latest --compress -f Dockerfile .
docker save crm-frontend:latest | gzip > crm-frontend.tar.gz
```

### Step 2: Transfer Files (using Git Bash or WSL)
```bash
scp -i C:\Users\Shubham\.ssh\ssh-key.key crm-frontend.tar.gz root@91.98.235.142:/tmp/
scp -i C:\Users\Shubham\.ssh\ssh-key.key docker-compose.yml root@91.98.235.142:/app/crm-frontend/
```

### Step 3: Deploy (using Git Bash or WSL)
```bash
ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 << 'EOF'
cd /app/crm-frontend

# Load and start
docker load < /tmp/crm-frontend.tar.gz
docker stop crm-frontend 2>/dev/null || true
docker rm crm-frontend 2>/dev/null || true
docker-compose up -d

# Verify
sleep 10
docker ps | grep crm-frontend
echo "✅ Deployment complete!"

# Cleanup
rm /tmp/crm-frontend.tar.gz
EOF
```

---

## 🔧 If You Don't Have Git Bash/WSL/SSH

### Install OpenSSH for Windows:

1. **Open PowerShell as Administrator:**
   ```powershell
   Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
   ```

2. **Or install Git for Windows:**
   - Download: https://git-scm.com/download/win
   - Check "Git Bash" and "Git LFS" during installation
   - Restart terminal after install

3. **Or enable WSL:**
   - Enable WSL 2 in Windows Features
   - Install Ubuntu from Microsoft Store

---

## ✅ Pre-Flight Checklist

- [ ] SSH key exists at: `C:\Users\Shubham\.ssh\ssh-key.key`
- [ ] Docker is installed and running: `docker --version`
- [ ] npm is installed: `npm --version`
- [ ] SSH/scp available in terminal: `ssh -V`
- [ ] You can SSH to server: `ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 echo "OK"`

---

## 📋 What Gets Deployed?

```
Server Directory Structure (Unchanged):
├── /app/
│   ├── crm-backend/           ← UNTOUCHED
│   ├── other-services/        ← UNTOUCHED
│   └── crm-frontend/          ← NEW (This deployment)
│       ├── docker-compose.yml
│       ├── Dockerfile
│       └── [container data]
```

**Important:** This deployment does NOT affect any existing projects!

---

## 🐳 What Docker Does

```
Local Build:
  Source Code → npm build → Docker Image → docker-compose.yml

Remote Deployment:
  Docker Image (compressed) → SSH Transfer → Load on Server → Start Container

Result:
  Container Name: crm-frontend
  Port: 3005 (internal) → Available on http://91.98.235.142:3005
  Path: /crm (e.g., http://91.98.235.142:3005/crm)
  Network: primeosys-network (isolated, connects with other services)
```

---

## 🌐 Nginx Configuration (Already Works)

If you have Nginx on the server, add this location block:

```nginx
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
```

Then reload Nginx:
```bash
sudo systemctl reload nginx
```

Now access via: `http://91.98.235.142/crm` → routes to container

---

## 🔍 After Deployment - Verify

### Check Container is Running:
```bash
ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 "docker ps | grep crm-frontend"
```

**Output should show:** `crm-frontend ... Up X seconds`

### View Logs:
```bash
ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 "docker logs crm-frontend"
```

**Expected logs:** Next.js ready and listening on port 3005

### Test Health:
```bash
ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 "docker exec crm-frontend wget -O- http://localhost:3005/crm"
```

**Expected:** HTML response from Next.js app

### Full Status:
```bash
ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 << 'EOF'
echo "=== Running Containers ===" 
docker ps | grep -E "crm|primeosys" || echo "None"

echo ""
echo "=== Container Details ==="
docker inspect crm-frontend | grep -E "State|Status|IPAddress"

echo ""
echo "=== Recent Logs ==="
docker logs --tail 30 crm-frontend

echo ""
echo "=== Network Status ==="
docker network inspect primeosys-network | grep "Containers" -A 20
EOF
```

---

## 🐛 Troubleshooting

### "SSH: Connection refused"
- Check SSH key is correct: `ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 "echo OK"`
- Check server is reachable: `ping 91.98.235.142`

### "Docker image transfer failed"
- Verify scp is available: `scp -V`
- Check file permissions on local machine
- Verify /tmp directory exists on server (it should)

### "Container won't start"
```bash
ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 "docker logs crm-frontend | tail -50"
```

Common issues:
- Port 3005 already in use: `docker ps -a` and `docker rm -f crm-frontend`
- Network doesn't exist: `docker network create primeosys-network`
- Permission denied: Run with `sudo docker` or add user to docker group

### "Frontend loads but shows blank/errors"
1. Check API base is correct in environment
2. Check API connectivity from container
3. View browser console for errors
4. Check docker logs for backend issues

### "High memory usage"
- Container limited to 512MB (max), 256MB (reserved)
- Check docker stats: `ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 "docker stats crm-frontend"`
- Review Next.js configuration for memory leaks

---

## 📦 Configuration Files

### docker-compose.yml
- **Service name**: `crm-frontend`
- **Container name**: `crm-frontend`
- **Port**: `3005:3005` (host:container)
- **Network**: `primeosys-network` (allows communication with other services)
- **Restart**: `unless-stopped` (restarts on crash, survives reboot)
- **Health check**: Every 30s, fails after 3 retries

### Dockerfile
- **Base image**: `node:20-alpine` (lightweight, ~150MB)
- **Multi-stage**: Reduces final image size
- **Port**: Exposes 3005
- **Health check**: Checks `/crm` endpoint
- **Environment**: Sets `NODE_ENV=production`

### next.config.ts
- **Base path**: `/crm` - all routes prefixed with /crm
- **Asset prefix**: `/crm` - CSS/JS/images load from /crm
- **Output**: `standalone` - optimized for Docker
- **Port**: `3005` - server listens on 3005

---

## 🔄 Update/Rollback

### Update to New Version:
```bash
# Build new image locally
npm run build
docker build -t crm-frontend:latest .

# Follow deployment steps again
docker save crm-frontend:latest | gzip > crm-frontend.tar.gz
scp -i C:\Users\Shubham\.ssh\ssh-key.key crm-frontend.tar.gz root@91.98.235.142:/tmp/

# On server, reload container
ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 "cd /app/crm-frontend && docker load < /tmp/crm-frontend.tar.gz && docker-compose up -d"
```

### Rollback (if something breaks):
```bash
# Stop current version
ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 "docker stop crm-frontend && docker rm crm-frontend"

# Load previous image (if you kept backup)
ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 "docker tag crm-frontend:previous crm-frontend:latest && cd /app/crm-frontend && docker-compose up -d"
```

---

## 📊 Next.js Optimization

The frontend includes optimization features:

- **Code Splitting**: Only necessary code loaded per page
- **Image Optimization**: Automatic image compression
- **Font Optimization**: Preload critical fonts
- **Lazy Loading**: Components load on demand
- **Static Generation**: Pre-built pages where possible

Check optimization status:
```bash
ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 "curl http://localhost:3005/crm/test-optimizations"
```

---

## 📞 Quick Reference Commands

| Task | Command |
|------|---------|
| Check status | `ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 "docker ps \| grep crm"` |
| View logs | `ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 "docker logs -f crm-frontend"` |
| Restart | `ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 "docker restart crm-frontend"` |
| Stop | `ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 "docker stop crm-frontend"` |
| Start | `ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 "cd /app/crm-frontend && docker-compose up -d"` |
| Remove | `ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 "docker rm crm-frontend"` |
| Shell access | `ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 "docker exec -it crm-frontend sh"` |
| Memory stats | `ssh -i C:\Users\Shubham\.ssh\ssh-key.key root@91.98.235.142 "docker stats crm-frontend"` |

---

## ✨ Success!

When complete, you'll have:
- ✅ CRM frontend running in Docker
- ✅ All existing projects still working
- ✅ Accessible at `http://91.98.235.142/crm`
- ✅ Configured with `/crm` base path
- ✅ Auto-restart on crash/reboot
- ✅ Health checks enabled
- ✅ Resource limits set
- ✅ Isolated network connection to other services

---

**Need help?** Check the full guide: `DEPLOYMENT_GUIDE.md`
