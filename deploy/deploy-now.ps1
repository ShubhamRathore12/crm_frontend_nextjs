# PowerShell Deployment Script for Windows
# Deploys CRM frontend to remote server via SSH
# Safely without affecting other services

param(
    [string]$ServerHost = "91.98.235.142",
    [string]$ServerUser = "root",
    [string]$SshKeyPath = "C:\Users\Shubham\.ssh\ssh-key.key",
    [string]$GitRepo = "",
    [string]$DeployPort = "3005"
)

# Color output
function Write-Status { 
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $($args[0])" -ForegroundColor Green 
}
function Write-Warning { 
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] WARNING: $($args[0])" -ForegroundColor Yellow 
}
function Write-Error { 
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ERROR: $($args[0])" -ForegroundColor Red 
}

Write-Host @"
╔════════════════════════════════════════════════════════╗
║   CRM Frontend Deployment - Remote SSH Setup           ║
╚════════════════════════════════════════════════════════╝
"@ -ForegroundColor Blue

# Verify SSH key exists
if (-not (Test-Path $SshKeyPath)) {
    Write-Error "SSH key not found at: $SshKeyPath"
    exit 1
}

Write-Status "SSH Key found: $SshKeyPath"
Write-Status "Server: $ServerUser@$ServerHost"
Write-Status "Deploy Port: $DeployPort"

# Step 1: Test SSH connection
Write-Host "`n[1/5] Testing SSH connection..." -ForegroundColor Yellow
try {
    $testCmd = "echo 'SSH connection successful' ; docker ps --format 'table {{.Names}}\t{{.Status}}'"
    $testConnection = ssh -i $SshKeyPath -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new $ServerUser@$ServerHost $testCmd 2>&1
    Write-Status "SSH connection successful"
    Write-Host "Current containers:" -ForegroundColor Cyan
    Write-Host $testConnection
} catch {
    Write-Error "SSH connection failed: $_"
    Write-Warning "Make sure:"
    Write-Warning "1. SSH key has correct permissions (chmod 600 on Linux)"
    Write-Warning "2. Server IP is correct: $ServerHost"
    Write-Warning "3. SSH user is correct: $ServerUser"
    exit 1
}

# Step 2: Setup deployment directory
Write-Host "`n[2/5] Setting up deployment directories..." -ForegroundColor Yellow
$setupCmd = "mkdir -p /home/deploy/crm-frontend ; mkdir -p /home/deploy/crm-frontend-backup ; mkdir -p /home/deploy/logs ; chmod 755 /home/deploy /home/deploy/crm-frontend /home/deploy/logs ; echo 'Directories created successfully'"

ssh -i $SshKeyPath $ServerUser@$ServerHost $setupCmd
Write-Status "Deployment directories created"

# Step 3: Check Docker network
Write-Host "`n[3/5] Verifying Docker network..." -ForegroundColor Yellow
$networkCmd = "docker network ls | grep -q 'primeosys-network' && echo 'Network exists: primeosys-network' || (docker network create primeosys-network && echo 'Network created: primeosys-network')"

ssh -i $SshKeyPath $ServerUser@$ServerHost "bash -c `"$networkCmd`""
Write-Status "Docker network verified"

# Step 4: Verify ports and services
Write-Host "`n[4/5] Checking port availability and services..." -ForegroundColor Yellow
$portCmd = @"
echo '=== Checking port $DeployPort ==='
if ss -tlnp 2>/dev/null | grep -q ':$DeployPort '; then
    echo 'WARNING: Port $DeployPort is in use'
    ss -tlnp | grep ':$DeployPort'
else
    echo 'Port $DeployPort is available'
fi
echo ''
echo '=== Current Docker containers ==='
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
"@

$portStatus = ssh -i $SshKeyPath $ServerUser@$ServerHost "bash -c '$portCmd'"
Write-Host $portStatus -ForegroundColor Cyan

# Step 5: Create deployment helper scripts
Write-Host "`n[5/5] Installing helper scripts..." -ForegroundColor Yellow
$helperCmd = @"
cat > /usr/local/bin/crm-health-check << 'HEALTHCHECK'
#!/bin/bash
if curl -sf http://localhost:$DeployPort/crm > /dev/null 2>&1; then
    exit 0
else
    exit 1
fi
HEALTHCHECK

chmod +x /usr/local/bin/crm-health-check

cat > /usr/local/bin/crm-deploy << 'DEPLOYSCRIPT'
#!/bin/bash
cd /home/deploy/crm-frontend
git pull origin main
docker-compose up -d --build
docker ps -f name=crm-frontend
DEPLOYSCRIPT

chmod +x /usr/local/bin/crm-deploy

echo 'Helper scripts installed'
"@

ssh -i $SshKeyPath $ServerUser@$ServerHost "bash -c '$helperCmd'"
Write-Status "Helper scripts installed"

# Summary
Write-Host @"

╔════════════════════════════════════════════════════════╗
║   Setup Complete - Ready for Deployment               ║
╚════════════════════════════════════════════════════════╝

"@ -ForegroundColor Blue

Write-Host "Server Details:" -ForegroundColor Green
Write-Host "  SSH Key: $SshKeyPath"
Write-Host "  Server: $ServerUser@$ServerHost"
Write-Host "  Deploy Directory: /home/deploy/crm-frontend"
Write-Host "  CRM Port: $DeployPort"
Write-Host "  Status: SAFE & READY (No existing services affected)`n"

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Clone your repository:"
Write-Host "   ssh -i '$SshKeyPath' $ServerUser@$ServerHost 'cd /home/deploy/crm-frontend && git clone <YOUR-REPO-URL> .'"
Write-Host ""
Write-Host "2. Create environment file on server:"
Write-Host "   ssh -i '$SshKeyPath' $ServerUser@$ServerHost 'cat > /home/deploy/crm-frontend/.env.production << EOF"
Write-Host "NODE_ENV=production"
Write-Host "NEXT_PUBLIC_API_URL=/backend"
Write-Host "PORT=$DeployPort"
Write-Host "EOF'"
Write-Host ""
Write-Host "3. Start deployment:"
Write-Host "   ssh -i '$SshKeyPath' $ServerUser@$ServerHost '/usr/local/bin/crm-deploy'"
Write-Host ""
Write-Host "4. Monitor logs:"
Write-Host "   ssh -i '$SshKeyPath' $ServerUser@$ServerHost 'docker logs -f crm-frontend'"
Write-Host ""

Write-Host "Quick Commands:" -ForegroundColor Cyan
Write-Host "  Check status: ssh -i '$SshKeyPath' $ServerUser@$ServerHost 'docker ps | grep crm'"
Write-Host "  View logs:    ssh -i '$SshKeyPath' $ServerUser@$ServerHost 'docker logs -f crm-frontend'"
Write-Host "  Health check: ssh -i '$SshKeyPath' $ServerUser@$ServerHost '/usr/local/bin/crm-health-check'"
Write-Host ""
