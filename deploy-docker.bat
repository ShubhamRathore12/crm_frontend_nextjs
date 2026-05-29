@echo off
REM Docker Deployment script for CRM Frontend
REM Deploys to /opt on the server

setlocal enabledelayedexpansion

echo.
echo ========================================
echo 🚀 Starting Docker Deployment
echo ========================================
echo.

REM Configuration
set SSH_KEY=C:\Users\Shubham\.ssh\ssh-key.key
set SERVER_USER=root
set SERVER_IP=91.98.235.142
set SERVER_PATH=/opt/crm-frontend
set DOCKER_IMAGE=crm-frontend:latest
set CONTAINER_NAME=crm-frontend

REM Step 1: Build Docker image
echo 📦 Building Docker image...
docker build -t %DOCKER_IMAGE% .

if errorlevel 1 (
    echo ❌ Docker build failed!
    exit /b 1
)

echo ✅ Docker image built successfully
echo.

REM Step 2: Save and transfer image
echo 💾 Saving Docker image...
docker save %DOCKER_IMAGE% | gzip > crm-frontend.tar.gz

echo 📤 Uploading Docker image to server...
scp -i "%SSH_KEY%" crm-frontend.tar.gz %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/

REM Step 3: Load image and start container
echo 🔧 Loading image and starting container on server...
ssh -i "%SSH_KEY%" %SERVER_USER%@%SERVER_IP% "cd %SERVER_PATH% && docker load < crm-frontend.tar.gz && docker stop %CONTAINER_NAME% 2>/dev/null; docker rm %CONTAINER_NAME% 2>/dev/null; docker run -d --name %CONTAINER_NAME% --restart always -p 3000:3000 %DOCKER_IMAGE% && docker ps | grep %CONTAINER_NAME%"

REM Cleanup
del crm-frontend.tar.gz

echo.
echo ========================================
echo ✅ Deployment completed successfully!
echo 🌐 Your CRM frontend is now live at http://%SERVER_IP%:3000
echo ========================================
echo.

endlocal
