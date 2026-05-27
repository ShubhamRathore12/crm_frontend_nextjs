# CRM Frontend Deployment Script (PowerShell - Simplified)

param(
    [string]$ServerIP = "91.98.235.142",
    [string]$ServerUser = "root",
    [string]$SSHKey = "C:\Users\Shubham\.ssh\ssh-key.key",
    [string]$DeployPath = "/opt/crm-frontend"
)

Write-Host ""
Write-Host "🚀 CRM Frontend Deployment Script" -ForegroundColor Magenta
Write-Host "==================================" -ForegroundColor Magenta
Write-Host ""

# Step 1: Build Docker image
Write-Host "📦 Step 1: Building optimized Docker image..." -ForegroundColor Cyan
docker build -t crm-frontend:latest --compress -f Dockerfile .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build Docker image" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker image built successfully" -ForegroundColor Green
Write-Host ""

# Step 2: Get image size
Write-Host "📊 Step 2: Checking image size..." -ForegroundColor Cyan
$imageSize = docker images --format "{{.Size}}" crm-frontend:latest
Write-Host "✅ Image size: $imageSize" -ForegroundColor Green
Write-Host ""

# Step 3: Save image
Write-Host "💾 Step 3: Saving Docker image to tar.gz..." -ForegroundColor Cyan
docker save crm-frontend:latest | gzip | Out-File -FilePath "crm-frontend.tar.gz" -Encoding Byte
$fileSize = (Get-Item "crm-frontend.tar.gz").Length / 1MB
Write-Host "✅ Image saved successfully (Size: $([Math]::Round($fileSize, 2)) MB)" -ForegroundColor Green
Write-Host ""

# Step 4: Transfer to server
Write-Host "🌐 Step 4: Transferring files to server..." -ForegroundColor Cyan
Write-Host "   Server: $ServerIP" -ForegroundColor Gray
Write-Host "   Deploy path: $DeployPath" -ForegroundColor Gray

# Create deployment directory
Write-Host "   Creating deployment directory..." -ForegroundColor Gray
ssh -i $SSHKey "$ServerUser@$ServerIP" "mkdir -p $DeployPath"

# Transfer image
Write-Host "   Transferring Docker image..." -ForegroundColor Gray
scp -i $SSHKey "crm-frontend.tar.gz" "$ServerUser@$ServerIP`:$DeployPath/"

# Transfer docker-compose
Write-Host "   Transferring docker-compose.yml..." -ForegroundColor Gray
scp -i $SSHKey "docker-compose.yml" "$ServerUser@$ServerIP`:$DeployPath/"

Write-Host "✅ Files transferred successfully" -ForegroundColor Green
Write-Host ""

# Step 5: Load and start container
Write-Host "🔄 Step 5: Loading image and starting container on server..." -ForegroundColor Cyan

$commands = @"
cd $DeployPath
docker load -i crm-frontend.tar.gz
docker stop crm-frontend 2>/dev/null; docker rm crm-frontend 2>/dev/null; true
docker-compose up -d
sleep 5
docker ps | grep crm-frontend
rm crm-frontend.tar.gz
"@

ssh -i $SSHKey "$ServerUser@$ServerIP" $commands

Write-Host "✅ Container started successfully" -ForegroundColor Green
Write-Host ""

# Step 6: Cleanup
Write-Host "🧹 Step 6: Cleaning up local files..." -ForegroundColor Cyan
Remove-Item "crm-frontend.tar.gz" -Force
Write-Host "✅ Local cleanup completed" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Deployment Summary:" -ForegroundColor Cyan
Write-Host "   - Server: $ServerIP" -ForegroundColor Gray
Write-Host "   - Deploy path: $DeployPath" -ForegroundColor Gray
Write-Host "   - Container: crm-frontend" -ForegroundColor Gray
Write-Host "   - Image size: $imageSize" -ForegroundColor Gray
Write-Host "   - URL: https://primeosys.com/crm" -ForegroundColor Gray
Write-Host ""

Write-Host "🔍 Verify deployment:" -ForegroundColor Cyan
Write-Host "   - Check container: ssh -i $SSHKey $ServerUser@$ServerIP 'docker ps'" -ForegroundColor Gray
Write-Host "   - View logs: ssh -i $SSHKey $ServerUser@$ServerIP 'docker logs crm-frontend'" -ForegroundColor Gray
Write-Host "   - Test URL: https://primeosys.com/crm" -ForegroundColor Gray
Write-Host ""

Write-Host "🎉 Done!" -ForegroundColor Green
Write-Host ""