# CRM Frontend Deployment Script for Windows
# Deploys to production server at 91.98.235.142:/app/crm-frontend
# Preserves all existing projects and configures for /crm path

param(
    [string]$Action = "deploy"  # deploy, status, logs, rollback
)

# Configuration
$SSH_KEY = "C:\Users\Shubham\.ssh\ssh-key.key"
$SERVER_USER = "root"
$SERVER_IP = "91.98.235.142"
$SERVER_DEPLOY_PATH = "/app/crm-frontend"
$CONTAINER_NAME = "crm-frontend"
$IMAGE_NAME = "crm-frontend:latest"

# Colors for output
$Success = "Green"
$Error_Color = "Red"
$Info = "Cyan"
$Warning = "Yellow"

function Write-Step {
    param([string]$Message)
    Write-Host "`n▶ $Message" -ForegroundColor $Info
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $Success
}

function Write-Error-Message {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $Error_Color
}

function Write-Warning-Message {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $Warning
}

function SSH-Command {
    param([string]$Command)
    ssh -i $SSH_KEY "$SERVER_USER@$SERVER_IP" $Command
}

function SCP-To-Server {
    param([string]$LocalPath, [string]$RemotePath)
    scp -i $SSH_KEY -r $LocalPath "$SERVER_USER@$SERVER_IP:$RemotePath"
}

function Check-Prerequisites {
    Write-Step "Checking prerequisites..."
    
    # Check SSH key exists
    if (-not (Test-Path $SSH_KEY)) {
        Write-Error-Message "SSH key not found at $SSH_KEY"
        exit 1
    }
    Write-Success "SSH key found"
    
    # Check Docker
    $docker = docker --version
    Write-Success "Docker found: $docker"
    
    # Check Node.js
    $node = node --version
    Write-Success "Node.js found: $node"
    
    # Check npm
    $npm = npm --version
    Write-Success "npm found: $npm"
}

function Build-Application {
    Write-Step "Building Next.js application..."
    
    # Install dependencies if needed
    if (-not (Test-Path "node_modules")) {
        Write-Step "Installing dependencies..."
        npm install
    }
    
    # Build for production
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Message "Build failed!"
        exit 1
    }
    
    Write-Success "Build completed successfully"
}

function Build-Docker-Image {
    Write-Step "Building Docker image..."
    
    docker build -t $IMAGE_NAME --compress -f Dockerfile .
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Message "Docker build failed!"
        exit 1
    }
    
    Write-Success "Docker image built: $IMAGE_NAME"
    
    # Show image size
    $imageSize = docker images --format "{{.Size}}" $IMAGE_NAME
    Write-Success "Image size: $imageSize"
}

function Save-And-Transfer-Image {
    Write-Step "Saving and transferring Docker image..."
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $archiveName = "crm-frontend-$timestamp.tar.gz"
    
    Write-Step "Saving Docker image as $archiveName..."
    docker save $IMAGE_NAME | gzip > $archiveName
    
    $fileSize = (Get-Item $archiveName).Length / 1MB
    Write-Success "Image saved: $archiveName (size: $([math]::Round($fileSize, 2))MB)"
    
    Write-Step "Transferring image to server..."
    SCP-To-Server $archiveName "/tmp/$archiveName"
    Write-Success "Image transferred to server"
    
    return $archiveName
}

function Transfer-Configs {
    Write-Step "Transferring configuration files..."
    
    # Create remote directory
    SSH-Command "mkdir -p $SERVER_DEPLOY_PATH"
    
    # Transfer docker-compose.yml
    SCP-To-Server "docker-compose.yml" "$SERVER_DEPLOY_PATH/"
    Write-Success "docker-compose.yml transferred"
    
    # Transfer nginx config if exists
    if (Test-Path "nginx-crm.conf") {
        SCP-To-Server "nginx-crm.conf" "$SERVER_DEPLOY_PATH/"
        Write-Success "nginx-crm.conf transferred"
    }
    
    # Transfer .env if exists (with caution)
    if (Test-Path ".env.production") {
        Write-Warning-Message "Skipping .env.production - configure on server manually"
    }
}

function Deploy-On-Server {
    param([string]$ArchiveName)
    
    Write-Step "Deploying on server..."
    
    $deployScript = @"
#!/bin/bash
set -e

echo "📦 Loading Docker image..."
docker load < /tmp/$ArchiveName

echo "🛑 Stopping existing container (if running)..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

echo "📂 Checking deployment directory..."
mkdir -p $SERVER_DEPLOY_PATH
cd $SERVER_DEPLOY_PATH

echo "🚀 Starting new container with docker-compose..."
docker-compose up -d

echo "⏳ Waiting for container to be healthy..."
sleep 10

echo "✅ Deployment complete!"
echo ""
echo "📋 Container status:"
docker ps | grep $CONTAINER_NAME || echo "Container not found!"

echo ""
echo "📝 Recent logs:"
docker logs --tail 20 $CONTAINER_NAME || echo "No logs available"

echo ""
echo "🧹 Cleaning up temporary files..."
rm -f /tmp/$ArchiveName

echo "✅ All done!"
"@
    
    # Execute deployment script on server
    SSH-Command $deployScript
    
    Write-Success "Deployment script executed on server"
}

function Verify-Deployment {
    Write-Step "Verifying deployment..."
    
    Write-Step "Checking if container is running..."
    $status = SSH-Command "docker ps | grep $CONTAINER_NAME | wc -l"
    
    if ([int]$status -eq 0) {
        Write-Error-Message "Container is not running!"
        SSH-Command "docker ps -a | grep $CONTAINER_NAME"
        Write-Step "Checking logs:"
        SSH-Command "docker logs $CONTAINER_NAME | tail -50"
        exit 1
    }
    
    Write-Success "Container is running"
    
    Write-Step "Checking container health..."
    $health = SSH-Command "docker inspect --format='{{.State.Health.Status}}' $CONTAINER_NAME" 2>$null
    Write-Success "Container health: $health"
    
    Write-Step "Checking port binding..."
    SSH-Command "docker port $CONTAINER_NAME"
    
    Write-Step "Checking recent logs..."
    SSH-Command "docker logs --tail 20 $CONTAINER_NAME"
}

function Show-Status {
    Write-Step "Checking deployment status..."
    
    Write-Host ""
    SSH-Command "echo '=== Container Status ===' && docker ps | grep $CONTAINER_NAME || echo 'Container not running'"
    
    Write-Host ""
    SSH-Command "echo '=== Recent Logs ===' && docker logs --tail 30 $CONTAINER_NAME"
    
    Write-Host ""
    SSH-Command "echo '=== Network Status ===' && docker network inspect primeosys-network | grep -A 5 Containers"
}

function Show-Logs {
    Write-Step "Streaming container logs (press Ctrl+C to stop)..."
    SSH-Command "docker logs -f $CONTAINER_NAME"
}

function Rollback {
    Write-Warning-Message "Rolling back to previous version..."
    
    SSH-Command @"
#!/bin/bash
cd $SERVER_DEPLOY_PATH

# Stop current container
docker stop $CONTAINER_NAME || true
docker rm $CONTAINER_NAME || true

# Check for backup image
BACKUP_IMAGE="crm-frontend:backup"
if docker images | grep -q "crm-frontend.*backup"; then
    echo "Found backup image, starting rollback..."
    docker tag \$BACKUP_IMAGE $IMAGE_NAME
    docker-compose up -d
    echo "Rollback completed"
else
    echo "No backup image found. Manual intervention required."
fi
"@
}

function Deploy-Full {
    try {
        Write-Host "`n$([char]27)[1m🚀 CRM FRONTEND DEPLOYMENT🚀$([char]27)[0m`n" -ForegroundColor Cyan
        
        Check-Prerequisites
        Build-Application
        Build-Docker-Image
        $archive = Save-And-Transfer-Image
        Transfer-Configs
        Deploy-On-Server $archive
        Verify-Deployment
        
        Write-Host "`n$([char]27)[1m✅ DEPLOYMENT SUCCESSFUL!$([char]27)[0m" -ForegroundColor Green
        Write-Host "`n📍 Access your CRM at:" -ForegroundColor Cyan
        Write-Host "   - Production: https://primeosys.com/crm" -ForegroundColor Green
        Write-Host "   - Server: http://91.98.235.142/crm" -ForegroundColor Green
        Write-Host "`n💡 Next steps:" -ForegroundColor Cyan
        Write-Host "   - Verify frontend loads correctly"
        Write-Host "   - Check API connectivity"
        Write-Host "   - Monitor container logs with: .\deploy-to-production.ps1 -Action logs"
        Write-Host ""
    }
    catch {
        Write-Error-Message "Deployment failed: $_"
        exit 1
    }
}

# Main execution
switch ($Action.ToLower()) {
    "deploy" {
        Deploy-Full
    }
    "status" {
        Show-Status
    }
    "logs" {
        Show-Logs
    }
    "rollback" {
        Rollback
    }
    default {
        Write-Host @"
Usage: .\deploy-to-production.ps1 [Action]

Actions:
  deploy   - Full deployment (build, docker, transfer, deploy)
  status   - Check deployment status and running containers
  logs     - Stream container logs
  rollback - Rollback to previous version

Examples:
  .\deploy-to-production.ps1 -Action deploy
  .\deploy-to-production.ps1 -Action logs
  .\deploy-to-production.ps1 -Action status
"@
    }
}
