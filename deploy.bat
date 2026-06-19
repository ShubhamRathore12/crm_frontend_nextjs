@echo off
setlocal enabledelayedexpansion

echo.
echo ===============================================
echo CRM Frontend Deployment
echo ===============================================
echo.

REM Configuration
set SERVER_IP=91.98.235.142
set SERVER_USER=root
set SSH_KEY=C:\Users\Shubham\.ssh\ssh-key.key
set DEPLOY_PATH=/opt/crm-frontend

echo Deployment Configuration:
echo   Server: !SERVER_IP!
echo   User: !SERVER_USER!
echo   Path: !DEPLOY_PATH!
echo.

REM Check if SSH key exists
if not exist "!SSH_KEY!" (
    echo ❌ SSH key not found: !SSH_KEY!
    pause
    exit /b 1
)

REM Check if ssh.exe exists
where ssh.exe >nul 2>&1
if errorlevel 1 (
    echo ❌ SSH not found. Please install OpenSSH.
    pause
    exit /b 1
)

echo Step 1: Verifying connection to server...
ssh -i "!SSH_KEY!" "!SERVER_USER!@!SERVER_IP!" "echo Connected" >nul 2>&1
if errorlevel 1 (
    echo ❌ Failed to connect to server
    pause
    exit /b 1
)
echo ✅ Connected to server
echo.

echo Step 2: Running deployment script on server...
ssh -i "!SSH_KEY!" "!SERVER_USER!@!SERVER_IP!" "cd !DEPLOY_PATH! && bash deploy.sh"
if errorlevel 1 (
    echo ❌ Deployment failed
    pause
    exit /b 1
)

echo.
echo ===============================================
echo ✅ Deployment Completed Successfully!
echo ===============================================
echo.
echo URL: https://primeosys.com/crm
echo.
pause
