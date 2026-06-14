# CRM Frontend Deployment Checklist

## ✅ Server Setup Complete
- [x] SSH connection verified
- [x] Docker verified and running
- [x] Docker network created: `primeosys-network`
- [x] Deployment directories created
- [x] Health check script installed
- [x] Deploy script installed
- [x] Port 3005 available
- [x] All existing services untouched

**Status**: Your server is ready for deployment!

---

## 📋 Pre-Deployment Checklist

### Local Setup
- [ ] Repository cloned locally
- [ ] `.env.production` file created with:
  ```
  NODE_ENV=production
  NEXT_PUBLIC_API_URL=/backend
  PORT=3005
  ```
- [ ] `Dockerfile` present in project root
- [ ] `docker-compose.yml` present in project root
- [ ] `.github/workflows/deploy.yml` configured for auto-deploy

### GitHub Configuration
- [ ] Repository is on GitHub
- [ ] GitHub Actions enabled in repository
- [ ] Added Secrets to GitHub (Settings → Secrets and variables → Actions):
  - `SERVER_HOST`: 91.98.235.142
  - `SERVER_USER`: root
  - `SERVER_SSH_KEY`: (your SSH private key content)
  - `SERVER_PORT`: 22

---

## 🚀 Deployment Steps

### Option 1: Manual Deployment (Test First)

#### Step 1: Clone Repository
```bash
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "cd /home/deploy/crm-frontend && rm -rf ./* ./.git* && git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git ."
```

#### Step 2: Create Environment File
```bash
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 << 'EOF'
cat > /home/deploy/crm-frontend/.env.production << 'ENVEOF'
NODE_ENV=production
NEXT_PUBLIC_API_URL=/backend
PORT=3005
ENVEOF
EOF
```

#### Step 3: Deploy
```bash
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "/usr/local/bin/crm-deploy"
```

#### Step 4: Verify
```bash
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "docker ps | grep crm && curl http://localhost:3005/crm"
```

---

### Option 2: Automatic Deployment (CI/CD)

#### Step 1: Commit All Changes
```bash
git add .
git commit -m "Setup CRM deployment with Docker and GitHub Actions"
git push origin main
```

#### Step 2: GitHub Actions
- Navigate to your GitHub repository
- Go to **Actions** tab
- The "Auto Deploy CRM Frontend" workflow will trigger
- Watch the deployment progress
- Check logs if there are any issues

#### Step 3: Monitor Deployment
```bash
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "docker logs -f crm-frontend"
```

---

## ✓ Post-Deployment Verification

### 1. Check Container Status
```bash
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "docker ps | grep crm-frontend"
```
Expected output: `crm-frontend` container should be UP

### 2. Test Health Check
```bash
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "/usr/local/bin/crm-health-check && echo 'Health check passed'"
```
Expected output: Exit code 0, "Health check passed"

### 3. Test API Endpoint
```bash
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "curl -I http://localhost:3005/crm"
```
Expected output: HTTP 200 or 308 (redirect)

### 4. Access via Browser
Visit: `https://primeosys.com/crm/`
Expected: CRM application loads

### 5. Verify Other Services Unaffected
```bash
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "docker ps | grep -E 'grain-backend|machine-config|myshaa'"
```
Expected: All should still be UP and healthy

---

## 🔍 Monitoring Commands

### View Real-time Logs
```bash
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "docker logs -f crm-frontend"
```

### Check Container Stats
```bash
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "docker stats crm-frontend"
```

### Check Disk Space
```bash
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "df -h | grep -E 'dev|crm|Deploy|Filesystem'"
```

### Check Network Status
```bash
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "docker network ls && docker network inspect primeosys-network"
```

---

## 🔄 If Deployment Fails

### Check Logs
```bash
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "docker logs crm-frontend 2>&1 | tail -50"
```

### Rollback
```bash
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "cd /home/deploy/crm-frontend-backup && docker-compose down && cd /home/deploy/crm-frontend-backup && docker-compose up -d"
```

### Restart Container
```bash
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "docker-compose -f /home/deploy/crm-frontend/docker-compose.yml restart"
```

### Full Redeploy
```bash
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "docker-compose -f /home/deploy/crm-frontend/docker-compose.yml down && /usr/local/bin/crm-deploy"
```

---

## 📝 Common Issues & Solutions

### Issue: Port 3005 Already in Use
```bash
# Find what's using it
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "ss -tlnp | grep 3005"

# Change port in docker-compose.yml and redeploy
```

### Issue: Insufficient Disk Space
```bash
# Check space
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "df -h"

# Clean up Docker
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "docker system prune -a"
```

### Issue: Out of Memory
```bash
# Check memory
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "free -h"

# Stop other containers temporarily
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 \
  "docker stop CONTAINER_NAME"
```

### Issue: Build Takes Too Long
- This is normal for first deployment
- Subsequent deployments are faster (layer caching)
- Check logs to see build progress

---

## 🎯 Success Criteria

✅ Deployment is successful when:
1. Container is running: `docker ps | grep crm-frontend` shows UP
2. Health check passes: `curl http://localhost:3005/crm` returns 200
3. App is accessible: `https://primeosys.com/crm/` loads
4. Existing services still running: `docker ps` shows all original containers
5. Logs show no errors: `docker logs crm-frontend` clean

---

## 📞 Support Resources

- **Docker Docs**: https://docs.docker.com/
- **Docker Compose**: https://docs.docker.com/compose/
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Nginx Proxy**: https://nginx.org/en/docs/
- **GitHub Actions**: https://docs.github.com/en/actions

---

## 🚦 Quick Status Check

Run this to see everything at a glance:

```bash
ssh -i "C:\Users\Shubham\.ssh\ssh-key.key" root@91.98.235.142 << 'EOF'
echo "=== CRM Frontend Status ==="
docker ps | grep crm && echo "✓ Container running" || echo "✗ Container NOT running"
/usr/local/bin/crm-health-check && echo "✓ Health check passing" || echo "✗ Health check FAILING"
echo ""
echo "=== All Containers ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "=== Disk & Memory ==="
df -h | grep /dev/
free -h | grep -E 'Mem|available'
EOF
```

---

**Next Step**: Choose Option 1 or 2 above to deploy your CRM frontend!

All configurations are set. Your deployment is ready to go! 🚀
