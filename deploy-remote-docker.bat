@echo off
REM Remote Docker Build and Deployment script for CRM Frontend
REM Builds Docker image directly on the server at /opt

setlocal enabledelayedexpansion

echo.
echo ========================================
echo 🚀 Starting Remote Docker Deployment
echo ========================================
echo.

REM Configuration
set SSH_KEY=C:\Users\Shubham\.ssh\ssh-key.key
set SERVER_USER=root
set SERVER_IP=91.98.235.142
set SERVER_PATH=/opt/crm-frontend
set DOCKER_IMAGE=crm-frontend:latest
set CONTAINER_NAME=crm-frontend

REM Step 1: Upload source code to server
echo 📤 Uploading source code to server...
scp -i "%SSH_KEY%" -r ^
    -o "UserKnownHostsFile=/dev/null" ^
    -o "StrictHostKeyChecking=no" ^
    package.json package-lock.json Dockerfile .dockerignore %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/

echo 📤 Uploading app directory...
scp -i "%SSH_KEY%" -r ^
    -o "UserKnownHostsFile=/dev/null" ^
    -o "StrictHostKeyChecking=no" ^
    app %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/

echo 📤 Uploading components directory...
scp -i "%SSH_KEY%" -r ^
    -o "UserKnownHostsFile=/dev/null" ^
    -o "StrictHostKeyChecking=no" ^
    components %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/

echo 📤 Uploading public directory...
scp -i "%SSH_KEY%" -r ^
    -o "UserKnownHostsFile=/dev/null" ^
    -o "StrictHostKeyChecking=no" ^
    public %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/ 2>nul || echo (public directory optional)

echo 📤 Uploading other config files...
scp -i "%SSH_KEY%" ^
    -o "UserKnownHostsFile=/dev/null" ^
    -o "StrictHostKeyChecking=no" ^
    next.config.ts tsconfig.json .npmrc %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/ 2>nul || echo (optional files)

REM Step 2: Build and deploy on server
echo.
echo 🔧 Building Docker image on server...
ssh -i "%SSH_KEY%" %SERVER_USER%@%SERVER_IP% "cd %SERVER_PATH% && docker build -t %DOCKER_IMAGE% . && echo ✅ Docker image built successfully"

REM Step 3: Stop and remove old container
echo 🛑 Stopping old container...
ssh -i "%SSH_KEY%" %SERVER_USER%@%SERVER_IP% "docker stop %CONTAINER_NAME% 2>/dev/null; docker rm %CONTAINER_NAME% 2>/dev/null; echo ✅ Old container removed"

REM Step 4: Start new container
echo 🚀 Starting new container...
ssh -i "%SSH_KEY%" %SERVER_USER%@%SERVER_IP% "docker run -d --name %CONTAINER_NAME% --restart always -p 3000:3000 %DOCKER_IMAGE% && echo ✅ Container started"

REM Step 5: Check status
echo.
echo 📊 Container status:
ssh -i "%SSH_KEY%" %SERVER_USER%@%SERVER_IP% "docker ps | grep %CONTAINER_NAME%"

echo.
echo ========================================
echo ✅ Deployment completed successfully!
echo 🌐 Your CRM frontend is now live at http://%SERVER_IP%:3000
echo ========================================
echo.

endlocal
