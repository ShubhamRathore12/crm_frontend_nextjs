@echo off
REM CRM Frontend Deployment Script
REM Deploys to: root@91.98.235.142:/app/crm-frontend
REM Access at: http://91.98.235.142/crm or https://primeosys.com/crm

setlocal enabledelayedexpansion

REM Configuration
set SSH_KEY=C:\Users\Shubham\.ssh\ssh-key.key
set SERVER_USER=root
set SERVER_IP=91.98.235.142
set SERVER_PATH=/app/crm-frontend
set CONTAINER_NAME=crm-frontend
set IMAGE_NAME=crm-frontend:latest

REM Colors setup (using WSL or git bash would be better for colors)
echo.
echo ===============================================
echo  CRM FRONTEND DEPLOYMENT SCRIPT
echo ===============================================
echo.

REM Check prerequisites
echo [1/6] Checking prerequisites...

if not exist "%SSH_KEY%" (
    echo ERROR: SSH key not found at %SSH_KEY%
    echo Please ensure the SSH key exists.
    pause
    exit /b 1
)
echo OK - SSH key found

where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Docker not found. Please install Docker Desktop.
    pause
    exit /b 1
)
echo OK - Docker found

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: npm not found. Please install Node.js.
    pause
    exit /b 1
)
echo OK - npm found

REM Build application
echo.
echo [2/6] Building Next.js application...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo OK - Build completed

REM Build Docker image
echo.
echo [3/6] Building Docker image...
call docker build -t %IMAGE_NAME% --compress -f Dockerfile .
if %errorlevel% neq 0 (
    echo ERROR: Docker build failed!
    pause
    exit /b 1
)
echo OK - Docker image built

REM Save Docker image
echo.
echo [4/6] Saving Docker image...
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set ARCHIVE_NAME=crm-frontend-%mydate%_%mytime%.tar.gz

echo Saving as %ARCHIVE_NAME%...
call docker save %IMAGE_NAME% | gzip > %ARCHIVE_NAME%
if %errorlevel% neq 0 (
    echo ERROR: Failed to save Docker image
    pause
    exit /b 1
)
echo OK - Image saved

REM Check if ssh/scp available (requires Git Bash or WSL)
echo.
echo [5/6] Transferring files to server...

where scp >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: scp/ssh not found in PATH
    echo.
    echo Please do the following:
    echo 1. Install Git for Windows or enable WSL
    echo 2. Add Git\usr\bin to your PATH
    echo 3. Or use OpenSSH for Windows: https://learn.microsoft.com/en-us/windows-server/administration/openssh/openssh_install_firstuse
    echo.
    echo For now, here are the manual commands to run in Git Bash or WSL:
    echo.
    echo scp -i "%SSH_KEY%" "%ARCHIVE_NAME%" root@%SERVER_IP%:/tmp/
    echo scp -i "%SSH_KEY%" docker-compose.yml root@%SERVER_IP%:%SERVER_PATH%/
    echo.
    echo Then run this command in Git Bash/WSL/SSH terminal:
    echo.
    echo ssh -i "%SSH_KEY%" root@%SERVER_IP% "cd %SERVER_PATH% && docker load ^< /tmp/%ARCHIVE_NAME% && docker stop %CONTAINER_NAME% 2^>/dev/null ^|^| true && docker rm %CONTAINER_NAME% 2^>/dev/null ^|^| true && docker-compose up -d && sleep 10 && docker ps ^| grep %CONTAINER_NAME% && rm /tmp/%ARCHIVE_NAME%"
    echo.
    pause
    exit /b 1
)

REM Transfer files
echo Transferring Docker image...
scp -i "%SSH_KEY%" "%ARCHIVE_NAME%" root@%SERVER_IP%:/tmp/
if %errorlevel% neq 0 (
    echo ERROR: Failed to transfer Docker image
    pause
    exit /b 1
)
echo OK - Image transferred

echo Transferring docker-compose.yml...
scp -i "%SSH_KEY%" docker-compose.yml root@%SERVER_IP%:%SERVER_PATH%/
if %errorlevel% neq 0 (
    echo ERROR: Failed to transfer docker-compose.yml
    pause
    exit /b 1
)
echo OK - docker-compose.yml transferred

REM Deploy on server
echo.
echo [6/6] Deploying on server...
echo Starting remote deployment script...

ssh -i "%SSH_KEY%" root@%SERVER_IP% > deploy.log 2>&1 << EOF
#!/bin/bash
set -e

cd %SERVER_PATH%

echo "Loading Docker image..."
docker load < /tmp/%ARCHIVE_NAME%

echo "Stopping existing container..."
docker stop %CONTAINER_NAME% 2>/dev/null || true
docker rm %CONTAINER_NAME% 2>/dev/null || true

echo "Starting new container..."
docker-compose up -d

echo "Waiting for container to be healthy..."
sleep 10

echo "Container status:"
docker ps | grep %CONTAINER_NAME% || echo "WARNING: Container may not have started!"

echo "Recent logs:"
docker logs --tail 20 %CONTAINER_NAME%

echo "Cleaning up..."
rm -f /tmp/%ARCHIVE_NAME%

echo "Deployment complete!"
EOF

if %errorlevel% neq 0 (
    echo ERROR: Deployment failed
    type deploy.log
    pause
    exit /b 1
)

REM Cleanup local file
echo Cleaning up local archive...
del /f /q "%ARCHIVE_NAME%" 2>nul
del /f /q "deploy.log" 2>nul

echo.
echo ===============================================
echo  DEPLOYMENT SUCCESSFUL!
echo ===============================================
echo.
echo Your CRM frontend is now deployed!
echo.
echo Access URLs:
echo   - http://91.98.235.142/crm
echo   - https://primeosys.com/crm
echo.
echo To verify deployment, run:
echo   ssh -i "%SSH_KEY%" root@%SERVER_IP% "docker ps | grep %CONTAINER_NAME%"
echo.
echo To view logs, run:
echo   ssh -i "%SSH_KEY%" root@%SERVER_IP% "docker logs -f %CONTAINER_NAME%"
echo.
echo ===============================================
echo.

pause
