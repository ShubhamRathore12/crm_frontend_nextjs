#!/bin/bash
# CRM Frontend Deployment Script
# Usage: Run this on the remote server after transferring the project

set -e

echo "=== CRM Frontend Docker Deployment ==="

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# Install Docker Compose plugin if not present
if ! docker compose version &> /dev/null; then
    echo "Installing Docker Compose plugin..."
    apt-get update && apt-get install -y docker-compose-plugin
fi

echo "Building and starting containers..."
docker compose down 2>/dev/null || true
docker compose build --no-cache
docker compose up -d

echo ""
echo "=== Deployment Complete ==="
echo "CRM Frontend is accessible at: http://$(hostname -I | awk '{print $1}')/crm"
echo ""
echo "Useful commands:"
echo "  docker compose logs -f        # View logs"
echo "  docker compose restart         # Restart services"
echo "  docker compose down            # Stop services"
