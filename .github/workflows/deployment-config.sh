#!/bin/bash

# CRM Frontend Deployment Configuration
# This script handles zero-downtime deployment

set -e

DEPLOY_DIR="/home/deploy/crm-frontend"
BACKUP_DIR="/home/deploy/crm-frontend-backup"
CONTAINER_NAME="crm-frontend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting CRM Frontend Deployment...${NC}"

# 1. Check if running container exists
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${YELLOW}Stopping existing container...${NC}"
    docker-compose -f ${DEPLOY_DIR}/docker-compose.yml down
fi

# 2. Create backup
echo -e "${YELLOW}Creating backup...${NC}"
if [ -d "${DEPLOY_DIR}" ]; then
    rm -rf ${BACKUP_DIR}
    cp -r ${DEPLOY_DIR} ${BACKUP_DIR}
fi

# 3. Pull latest code
echo -e "${YELLOW}Pulling latest code...${NC}"
cd ${DEPLOY_DIR}
git pull origin main

# 4. Build and start new container
echo -e "${YELLOW}Building and starting new container...${NC}"
docker-compose -f ${DEPLOY_DIR}/docker-compose.yml up -d --build

# 5. Wait for container to be healthy
echo -e "${YELLOW}Waiting for container to be healthy...${NC}"
sleep 5

if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    # Wait for health check
    for i in {1..30}; do
        if docker inspect --format='{{.State.Health.Status}}' ${CONTAINER_NAME} 2>/dev/null | grep -q "healthy"; then
            echo -e "${GREEN}Container is healthy!${NC}"
            break
        fi
        echo -e "${YELLOW}Waiting for container health... ($i/30)${NC}"
        sleep 2
    done
else
    echo -e "${RED}Container failed to start!${NC}"
    # Rollback
    docker-compose -f ${BACKUP_DIR}/docker-compose.yml up -d
    exit 1
fi

# 6. Test endpoint
echo -e "${YELLOW}Testing endpoint...${NC}"
if curl -f http://localhost:3005/crm > /dev/null 2>&1; then
    echo -e "${GREEN}Endpoint is responding correctly${NC}"
else
    echo -e "${RED}Endpoint test failed!${NC}"
    # Rollback
    docker-compose -f ${BACKUP_DIR}/docker-compose.yml up -d
    exit 1
fi

echo -e "${GREEN}Deployment completed successfully!${NC}"
