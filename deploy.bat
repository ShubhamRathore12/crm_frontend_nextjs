@echo off
REM Deployment script for CRM Frontend (Windows)
REM This script builds and deploys the Next.js frontend to the production server

setlocal enabledelayedexpansion

echo.
echo ========================================
echo 🚀 Starting CRM Frontend Deployment
echo ========================================
echo.

REM Configuration
set SSH_KEY=C:\Users\Shubham\.ssh\ssh-key.key
set SERVER_USER=root
set SERVER_IP=91.98.235.142
set SERVER_PATH=/app/crm-frontend

REM Step 1: Build the application
echo 📦 Building Next.js application...
call npm run build

if errorlevel 1 (
    echo ❌ Build failed!
    exit /b 1
)

echo ✅ Build completed successfully
echo.

REM Step 2: Create deployment directory on server
echo 📁 Creating deployment directory on server...
ssh -i "%SSH_KEY%" %SERVER_USER%@%SERVER_IP% "mkdir -p %SERVER_PATH%"

REM Step 3: Deploy files using SCP
echo 📤 Uploading files to server...
echo Uploading source files...
scp -i "%SSH_KEY%" -r ^
    -o "UserKnownHostsFile=/dev/null" ^
    -o "StrictHostKeyChecking=no" ^
    package.json %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/
scp -i "%SSH_KEY%" -r ^
    -o "UserKnownHostsFile=/dev/null" ^
    -o "StrictHostKeyChecking=no" ^
    package-lock.json %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/
scp -i "%SSH_KEY%" -r ^
    -o "UserKnownHostsFile=/dev/null" ^
    -o "StrictHostKeyChecking=no" ^
    public %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/
scp -i "%SSH_KEY%" -r ^
    -o "UserKnownHostsFile=/dev/null" ^
    -o "StrictHostKeyChecking=no" ^
    app %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/
scp -i "%SSH_KEY%" -r ^
    -o "UserKnownHostsFile=/dev/null" ^
    -o "StrictHostKeyChecking=no" ^
    components %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/

REM Step 4: Copy built files
echo 📤 Uploading built files...
scp -i "%SSH_KEY%" -r ^
    -o "UserKnownHostsFile=/dev/null" ^
    -o "StrictHostKeyChecking=no" ^
    .next %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/

REM Step 5: Install dependencies and start
echo 🔧 Installing dependencies and starting application...
ssh -i "%SSH_KEY%" %SERVER_USER%@%SERVER_IP% "cd %SERVER_PATH% && npm install --production && npm run start"

echo.
echo ========================================
echo ✅ Deployment completed successfully!
echo 🌐 Your CRM frontend is now live at http://%SERVER_IP%
echo ========================================
echo.

endlocal
