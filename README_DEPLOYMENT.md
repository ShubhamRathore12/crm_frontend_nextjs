# 🚀 CRM Frontend - Simplified Deployment

## Single Command Deployment

### For Windows Users
```batch
deploy.bat
```

### For Linux/Mac Users
```bash
ssh -i ~/.ssh/ssh-key.key root@91.98.235.142 "cd /opt/crm-frontend && bash deploy.sh"
```

## What Happens When You Deploy?

The deployment script automatically:

1. ✅ Builds optimized Docker image (~2-3 minutes)
2. ✅ Stops and removes old container
3. ✅ Starts new container on port 3005
4. ✅ Verifies application health
5. ✅ Displays deployment status

## No More Complexity

✨ **Before**: 30+ deployment files (scripts, guides, configs)
✨ **After**: 3 files (deploy.sh, deploy.bat, this guide)

## Files You Need

```
Root Directory
├── Dockerfile           (Container definition)
├── docker-compose.yml   (Docker Compose config)
├── deploy.sh            (Main deployment script)
├── deploy.bat           (Windows launcher)
└── .dockerignore        (Exclude files from image)
```

## Server Details

- **Server**: 91.98.235.142
- **User**: root
- **Application Port**: 3005
- **Public URL**: https://primeosys.com/crm
- **Network**: primeosys-network

## Container Management

After deployment, use these commands:

```bash
# View logs
ssh root@91.98.235.142 "docker logs crm-frontend -f"

# Restart container
ssh root@91.98.235.142 "docker restart crm-frontend"

# Stop container
ssh root@91.98.235.142 "docker stop crm-frontend"

# Check status
ssh root@91.98.235.142 "docker ps | grep crm-frontend"
```

## Environment

- **Node Version**: 20 (Alpine Linux)
- **Memory**: 512MB limit
- **CPU**: 1 CPU limit
- **Build Time**: ~2-3 minutes
- **Startup Time**: ~10 seconds

## That's It!

No documentation clutter, no confusion about which script to use.

Just run `deploy.bat` (or the SSH command) and you're done! 🎉
