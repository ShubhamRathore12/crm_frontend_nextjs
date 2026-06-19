# ⚡ Quick Start Deployment

## Prerequisites
✅ SSH access to server (91.98.235.142)
✅ Docker installed on server
✅ SSH key configured at: `C:\Users\Shubham\.ssh\ssh-key.key`

## Deployment (Windows)
```batch
deploy.bat
```
That's it! The script will:
- Build the Docker image
- Stop old container
- Start new container
- Verify it's working

## Deployment (Linux/Mac)
```bash
ssh -i ~/.ssh/ssh-key.key root@91.98.235.142 "cd /opt/crm-frontend && bash deploy.sh"
```

## What Happens
1. **~2-3 minutes**: Docker builds the application
2. **~10 seconds**: Container starts and becomes available
3. **~5 seconds**: Health checks verify it's working
4. **Done!** Application is live

## Verify Deployment
```bash
# Check if container is running
ssh -i ~/.ssh/ssh-key.key root@91.98.235.142 "docker ps | grep crm-frontend"

# View recent logs
ssh -i ~/.ssh/ssh-key.key root@91.98.235.142 "docker logs crm-frontend --tail 20"

# Test the application
curl https://primeosys.com/crm
```

## If Something Goes Wrong

### Container won't start
```bash
# Check logs
ssh root@91.98.235.142 "docker logs crm-frontend"

# Get more details
ssh root@91.98.235.142 "docker inspect crm-frontend"
```

### Application not responding
```bash
# Restart the container
ssh root@91.98.235.142 "docker restart crm-frontend"

# Wait 10 seconds and check again
sleep 10
ssh root@91.98.235.142 "docker logs crm-frontend --tail 5"
```

### Need to redeploy
```bash
# Just run deployment again
deploy.bat
```

## File Reference

| File | Purpose |
|------|---------|
| `deploy.bat` | Windows launcher - double click to deploy |
| `deploy.sh` | Server script - runs the deployment |
| `Dockerfile` | Container definition |
| `docker-compose.yml` | Docker Compose config |
| `DEPLOYMENT.md` | Full documentation |

## That's All You Need to Know! 🚀
