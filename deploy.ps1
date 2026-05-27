# CRM Frontend Deployment Script (PowerShell)
# This script builds and deploys the optimized CRM frontend to the server

param(
    [string]$ServerIP = "91.98.235.142",
    [string]$ServerUser = "root",
    [string]$SSHKey = "C:\Users\Shubham\.ssh\ssh-key.key",
    [string]$DeployPath = "/opt/crm-frontend",
    [string]$DockerImage = "crm-frontend:latest"
)

# Color output
function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Main deployment
Write-Host ""
Write-Host "🚀 CRM Frontend Deployment Script" -ForegroundColor Magenta
Write-Host "==================================" -ForegroundColor Magenta
Write-Host ""

# Step 1: Build Docker image
Write-Info "Step 1: Building optimized Docker image..."
try {
    docker build -t $DockerImage --compress -f Dockerfile .
    Write-Success "Docker image built successfully"
    
    # Get image size
    $imageInfo = docker images --format "{{.Size}}" $DockerImage
    Write-Info "Image size: $imageInfo"
} catch {
    Write-Error "Failed to build Docker image: $_"
    exit 1
}

Write-Host ""

# Step 2: Verify image
Write-Info "Step 2: Verifying Docker image..."
try {
    $imageExists = docker images $DockerImage --quiet
    if ($imageExists) {
        Write-Success "Docker image verified"
    } else {
        throw "Image not found"
    }
} catch {
    Write-Error "Failed to verify Docker image: $_"
    exit 1
}

Write-Host ""

# Step 3: Save image
Write-Info "Step 3: Saving Docker image to tar.gz..."
try {
    docker save $DockerImage | gzip | Out-File -FilePath "crm-frontend.tar.gz" -Encoding Byte
    $fileSize = (Get-Item "crm-frontend.tar.gz").Length / 1MB
    Write-Success "Image saved successfully (Size: $([Math]::Round($fileSize, 2)) MB)"
} catch {
    Write-Error "Failed to save Docker image: $_"
    exit 1
}

Write-Host ""

# Step 4: Transfer to server
Write-Info "Step 4: Transferring image to server..."
Write-Info "Server: $ServerIP"
Write-Info "Deploy path: $DeployPath"

try {
    # Create deployment directory
    Write-Info "Creating deployment directory on server..."
    ssh -i $SSHKey "$ServerUser@$ServerIP" "mkdir -p $DeployPath"
    Write-Success "Deployment directory created"
    
    # Transfer image
    Write-Info "Transferring Docker image..."
    scp -i $SSHKey "crm-frontend.tar.gz" "$ServerUser@$ServerIP`:$DeployPath/"
    Write-Success "Image transferred successfully"
    
    # Transfer docker-compose
    Write-Info "Transferring docker-compose.yml..."
    scp -i $SSHKey "docker-compose.yml" "$ServerUser@$ServerIP`:$DeployPath/"
    Write-Success "docker-compose.yml transferred"
    
} catch {
    Write-Error "Failed to transfer files: $_"
    exit 1
}

Write-Host ""

# Step 5: Load and start container
Write-Info "Step 5: Loading image and starting container on server..."
try {
    $deployScript = @"
cd $DeployPath

# Load Docker image
echo 'Loading Docker image...'
docker load < crm-frontend.tar.gz

# Stop existing container
echo 'Stopping existing container...'
docker stop crm-frontend 2>/dev/null || true
docker rm crm-frontend 2>/dev/null || true

# Start new container
echo 'Starting new container...'
docker-compose up -d

# Wait for container to be healthy
sleep 5

# Check container status
echo 'Container status:'
docker ps | grep crm-frontend

# Clean up tar file
rm crm-frontend.tar.gz

echo 'Deployment completed successfully!'
"@
    
    ssh -i $SSHKey "$ServerUser@$ServerIP" $deployScript
    Write-Success "Container started successfully"
    
} catch {
    Write-Error "Failed to start container: $_"
    exit 1
}

Write-Host ""

# Step 6: Verify deployment
Write-Info "Step 6: Verifying deployment..."
try {
    $containerStatus = ssh -i $SSHKey "$ServerUser@$ServerIP" "docker ps | grep crm-frontend"
    if ($containerStatus) {
        Write-Success "Container is running"
        Write-Info "Container status: $containerStatus"
    } else {
        Write-Warning "Container may not be running. Check logs with: docker logs crm-frontend"
    }
} catch {
    Write-Warning "Could not verify container status: $_"
}

Write-Host ""

# Cleanup
Write-Info "Cleaning up local files..."
Remove-Item "crm-frontend.tar.gz" -Force
Write-Success "Local cleanup completed"

Write-Host ""
Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Deployment Summary:" -ForegroundColor Cyan
Write-Host "   - Server: $ServerIP"
Write-Host "   - Deploy path: $DeployPath"
Write-Host "   - Container: crm-frontend"
Write-Host "   - URL: https://primeosys.com/crm"
Write-Host ""
Write-Host "🔍 Verify deployment:" -ForegroundColor Cyan
Write-Host "   - Check container: ssh -i $SSHKey $ServerUser@$ServerIP 'docker ps'"
Write-Host "   - View logs: ssh -i $SSHKey $ServerUser@$ServerIP 'docker logs crm-frontend'"
Write-Host "   - Test URL: https://primeosys.com/crm"
Write-Host ""
Write-Host "🎉 Done!" -ForegroundColor Green
Write-Host ""