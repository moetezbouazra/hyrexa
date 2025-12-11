#!/bin/bash

# Hyrexa Deployment Script for VPS
# Run this script on your VPS: vps-808bca14.vps.ovh.net

echo "🚀 Hyrexa Deployment Script"
echo "=============================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Install Docker with:"
    echo "  curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "  sudo sh get-docker.sh"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    echo "Install Docker Compose plugin with:"
    echo "  sudo apt-get update"
    echo "  sudo apt-get install docker-compose-plugin"
    exit 1
fi

echo -e "${GREEN}✓ Docker is installed${NC}"
echo -e "${GREEN}✓ Docker Compose is installed${NC}"

# Check if Docker daemon is running
if ! sudo docker ps &> /dev/null; then
    echo -e "${RED}❌ Docker daemon is not running${NC}"
    echo "Start Docker with: sudo systemctl start docker"
    exit 1
fi

echo -e "${GREEN}✓ Docker daemon is running${NC}"

# Navigate to project directory
PROJECT_DIR="/home/ubuntu/hyrexa"

if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Project directory not found: $PROJECT_DIR${NC}"
    echo ""
    echo "Please clone the repository first:"
    echo "  cd ~"
    echo "  git clone <your-repo-url> hyrexa"
    echo "  cd hyrexa"
    exit 1
fi

cd "$PROJECT_DIR"
echo -e "${GREEN}✓ Changed to project directory: $PROJECT_DIR${NC}"

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ docker-compose.yml not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ docker-compose.yml found${NC}"

# Stop existing containers
echo ""
echo -e "${YELLOW}Stopping existing containers...${NC}"
sudo docker compose down

# Pull latest images (if using remote images)
# sudo docker compose pull

# Build and start containers
echo ""
echo -e "${YELLOW}Building and starting containers...${NC}"
sudo docker compose up -d --build

# Wait for containers to start
echo ""
echo -e "${YELLOW}Waiting for containers to start...${NC}"
sleep 10

# Check container status
echo ""
echo -e "${YELLOW}Container Status:${NC}"
sudo docker compose ps

# Check backend logs
echo ""
echo -e "${YELLOW}Backend Logs (last 20 lines):${NC}"
sudo docker compose logs backend --tail=20

# Test health endpoint
echo ""
echo -e "${YELLOW}Testing health endpoint...${NC}"
sleep 3

if curl -f http://localhost:5000/health &> /dev/null; then
    echo -e "${GREEN}✓ Backend is responding on http://localhost:5000/health${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    echo "Check logs with: sudo docker compose logs backend"
fi

# Test from external
echo ""
echo -e "${YELLOW}Testing external access...${NC}"
EXTERNAL_IP=$(curl -s ifconfig.me)
echo "External IP: $EXTERNAL_IP"

if curl -f http://$EXTERNAL_IP:5000/health &> /dev/null; then
    echo -e "${GREEN}✓ Backend is accessible externally${NC}"
else
    echo -e "${YELLOW}⚠️  Backend not accessible externally (firewall might be blocking)${NC}"
fi

# Final status
echo ""
echo "=============================="
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "Useful commands:"
echo "  View logs:        sudo docker compose logs -f"
echo "  View backend:     sudo docker compose logs -f backend"
echo "  Restart:          sudo docker compose restart"
echo "  Stop:             sudo docker compose down"
echo "  Rebuild:          sudo docker compose up -d --build"
echo ""
echo "Access URLs:"
echo "  Health Check:     http://vps-808bca14.vps.ovh.net:5000/health"
echo "  API:              http://vps-808bca14.vps.ovh.net:5000/api"
echo "  Frontend:         http://vps-808bca14.vps.ovh.net:5173"
