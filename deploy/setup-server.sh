#!/bin/bash

# Safe Server Deployment Setup
# This script sets up the CRM frontend deployment environment
# WITHOUT affecting any running services

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   CRM Frontend - Safe Deployment Setup                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

# 1. Check current services
echo -e "\n${YELLOW}[1/8] Checking current running services...${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || echo "Docker not running or no containers"

# 2. Create deployment directory
echo -e "\n${YELLOW}[2/8] Creating deployment directories...${NC}"
mkdir -p /home/deploy/crm-frontend
mkdir -p /home/deploy/crm-frontend-backup
mkdir -p /home/deploy/logs
chmod 755 /home/deploy /home/deploy/crm-frontend /home/deploy/logs

# 3. Check if Docker network exists
echo -e "\n${YELLOW}[3/8] Checking Docker network...${NC}"
if ! docker network ls | grep -q "primeosys-network"; then
    echo -e "${GREEN}Creating primeosys-network...${NC}"
    docker network create primeosys-network
else
    echo -e "${GREEN}primeosys-network already exists${NC}"
fi

# 4. Verify ports are available for CRM
echo -e "\n${YELLOW}[4/8] Checking port 3005 availability...${NC}"
if ss -tlnp 2>/dev/null | grep -q ":3005 "; then
    echo -e "${RED}⚠️  Port 3005 is already in use!${NC}"
    echo -e "${YELLOW}Current process using port 3005:${NC}"
    ss -tlnp | grep ":3005"
    echo -e "${YELLOW}If this is a running service, choose a different port${NC}"
else
    echo -e "${GREEN}Port 3005 is available${NC}"
fi

# 5. Check Docker is running
echo -e "\n${YELLOW}[5/8] Checking Docker daemon...${NC}"
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}ERROR: Docker is not running${NC}"
    echo -e "${YELLOW}Start Docker with: systemctl start docker${NC}"
    exit 1
else
    echo -e "${GREEN}Docker is running${NC}"
fi

# 6. Verify Docker compose
echo -e "\n${YELLOW}[6/8] Checking Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}Docker Compose not found. Installing...${NC}"
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}Docker Compose installed${NC}"
else
    echo -e "${GREEN}Docker Compose is installed${NC}"
fi

# 7. Setup deployment user
echo -e "\n${YELLOW}[7/8] Verifying deployment user...${NC}"
if ! id -u deploy > /dev/null 2>&1; then
    echo -e "${YELLOW}Creating deploy user...${NC}"
    useradd -m -s /bin/bash -G docker deploy || true
    echo -e "${GREEN}Deploy user created (or already exists)${NC}"
else
    echo -e "${GREEN}Deploy user already exists${NC}"
fi

# 8. Create health check script
echo -e "\n${YELLOW}[8/8] Setting up health check script...${NC}"
cat > /usr/local/bin/crm-health-check << 'EOF'
#!/bin/bash
# Health check for CRM frontend
if curl -sf http://localhost:3005/crm > /dev/null 2>&1; then
    exit 0
else
    exit 1
fi
EOF
chmod +x /usr/local/bin/crm-health-check
echo -e "${GREEN}Health check script created${NC}"

# Final verification
echo -e "\n${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Deployment Setup Complete                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${GREEN}✓ Server is ready for CRM frontend deployment${NC}"
echo -e "\n${YELLOW}Current Service Status:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo -e "1. Clone repository: cd /home/deploy/crm-frontend && git clone <repo-url> ."
echo -e "2. Create .env.production with NODE_ENV=production"
echo -e "3. Run: docker-compose up -d"
echo -e "4. Check status: docker ps | grep crm-frontend"
echo -e "5. Test: curl http://localhost:3005/crm"

echo -e "\n${YELLOW}To monitor CRM deployment:${NC}"
echo -e "docker logs -f crm-frontend"

echo -e "\n${GREEN}Deployment environment is isolated and safe.${NC}"
echo -e "${BLUE}No existing services or functionalities have been affected.${NC}\n"
