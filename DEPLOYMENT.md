# CRM Frontend Auto-Deployment Guide

This guide explains how to set up automatic deployment when pushing code to GitHub.

## Prerequisites

1. Docker and Docker Compose installed on your server
2. GitHub repository access
3. SSH access to your production server

## Setup Instructions

### Step 1: Configure GitHub Secrets

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

- `SERVER_HOST`: Your server's IP address or domain
- `SERVER_USER`: SSH username (e.g., `deploy`)
- `SERVER_PORT`: SSH port (default: 22)
- `SERVER_SSH_KEY`: Your SSH private key (without passphrase)

### Step 2: Prepare Server

Run these commands on your production server:

```bash
# Create deployment directory
mkdir -p /home/deploy/crm-frontend
cd /home/deploy/crm-frontend

# Clone your repository
git clone <your-repo-url> .

# Create docker network (if not exists)
docker network create primeosys-network || true

# Make deployment script executable
chmod +x .github/workflows/deployment-config.sh
```

### Step 3: Configure Environment

Create `.env.production` on your server:

```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=/backend
PORT=3005
```

### Step 4: Test Deployment

Push to your main branch:

```bash
git push origin main
```

The GitHub Actions workflow will:
1. Build your Next.js application
2. Create a Docker image
3. Push image to GitHub Container Registry
4. Deploy to your server via SSH
5. Start the container with health checks

## Deployment Flow

```
Push to GitHub
     ↓
GitHub Actions triggered
     ↓
Build Next.js app
     ↓
Build Docker image
     ↓
Push to registry
     ↓
SSH into server
     ↓
Pull latest code
     ↓
Build & start container
     ↓
Health check
     ↓
Test endpoint
     ↓
Deployment complete ✓
```

## Nginx Configuration

The app is available at `https://primeosys.com/crm/`

**Important:** The server name (`primeosys.com`) is NOT included in the path after `/crm`. The application handles routing internally.

### Key Nginx Rules:
- `/crm/` → Proxies to `http://127.0.0.1:3005/`
- `/crm/_next/static` → Cached for 1 year
- `/crm/api/` → API routes proxied to backend

## Monitoring Deployment

### Check logs:
```bash
docker logs crm-frontend -f
```

### Check container status:
```bash
docker ps -f "name=crm-frontend"
```

### Test health:
```bash
curl http://localhost:3005/crm
```

## Rollback Procedure

If deployment fails, it automatically rolls back to the previous container version.

To manually rollback:

```bash
cd /home/deploy/crm-frontend-backup
docker-compose -f docker-compose.yml up -d
```

## Environment Variables

| Variable | Value | Purpose |
|----------|-------|---------|
| NODE_ENV | production | Run in production mode |
| NEXT_PUBLIC_API_URL | /backend | API base URL |
| PORT | 3005 | Container port |

## Troubleshooting

### Deployment fails to connect
- Check `SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_KEY` secrets
- Ensure SSH key has no passphrase
- Verify server's SSH port is correct

### Container not starting
- Check Docker and Docker Compose are installed: `docker --version`
- Check network exists: `docker network ls | grep primeosys`
- Review logs: `docker logs crm-frontend`

### Health check failing
- Ensure app starts on port 3005
- Check `NEXT_PUBLIC_API_URL` is set correctly
- Review application logs for errors

## Zero-Downtime Deployment

The deployment script ensures zero downtime by:
1. Stopping old container gracefully
2. Building new container
3. Waiting for health checks to pass
4. Testing endpoint
5. Automatic rollback on failure

## Next Steps

1. Add GitHub secrets to your repository
2. Prepare your server following "Configure Server" section
3. Push code to trigger deployment
4. Monitor logs during first deployment

For issues, check the GitHub Actions workflow logs in your repository.
