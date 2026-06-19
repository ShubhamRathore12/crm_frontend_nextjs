# CRM Frontend - Deployment Guide

## Quick Start (Windows)

Simply run:
```batch
deploy.bat
```

## Quick Start (Linux/Mac)

```bash
ssh -i ~/.ssh/ssh-key.key root@91.98.235.142 "cd /opt/crm-frontend && bash deploy.sh"
```

## What Gets Deployed?

✅ **Production Build**: Optimized Next.js application
✅ **Docker Container**: Isolated, self-contained deployment
✅ **Port 3005**: Running on dedicated port
✅ **Auto-restart**: Container restarts automatically on failure
✅ **Health Checks**: Automatic health monitoring

## Deployment Process

1. **Build Docker Image** - Compiles Next.js app and creates Docker image
2. **Stop Old Container** - Gracefully stops previous version
3. **Start New Container** - Launches new container with updated code
4. **Verify Health** - Checks if application is running correctly

## Server Information

| Property | Value |
|----------|-------|
| **Host** | 91.98.235.142 |
| **User** | root |
| **Port** | 3005 |
| **Container** | crm-frontend |
| **Network** | primeosys-network |
| **URL** | https://primeosys.com/crm |

## Files Included

- `Dockerfile` - Container build definition
- `docker-compose.yml` - Docker Compose configuration
- `deploy.sh` - Deployment script (runs on server)
- `deploy.bat` - Windows deployment launcher
- `.dockerignore` - Files to exclude from Docker image

## Troubleshooting

### Check Container Status
```bash
docker ps | grep crm-frontend
```

### View Logs
```bash
docker logs crm-frontend -f
```

### Restart Container
```bash
docker restart crm-frontend
```

### Stop Container
```bash
docker stop crm-frontend
```

### Remove Container
```bash
docker rm crm-frontend
```

### Rebuild Image
```bash
docker build -t crm-frontend:latest /opt/crm-frontend
```

## Environment Variables

| Variable | Value |
|----------|-------|
| NODE_ENV | production |
| PORT | 3005 |
| NEXT_PUBLIC_API_BASE | https://primeosys.com/crm-backend |

## Performance

- **Memory Limit**: 512MB
- **CPU Limit**: 1 CPU
- **Health Check Interval**: 30 seconds
- **Build Time**: ~2-3 minutes
- **Startup Time**: ~10 seconds

## Notes

- All deployment markdown files have been removed to keep things simple
- Single deployment script handles everything
- Docker handles container lifecycle automatically
- Application is served over HTTPS with nginx proxy
- All logs can be viewed with `docker logs crm-frontend`
