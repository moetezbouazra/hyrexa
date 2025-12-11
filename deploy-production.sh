#!/bin/bash

# Hyrexa Production Deployment Script
# Run this script on your VPS: vps-808bca14.vps.ovh.net

echo "🚀 Hyrexa Production Deployment Script"
echo "========================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
    exit 1
fi

echo -e "${GREEN}✓ Docker is installed${NC}"
echo -e "${GREEN}✓ Docker Compose is installed${NC}"

# Check if Docker daemon is running
if ! docker ps &> /dev/null; then
    echo -e "${RED}❌ Docker daemon is not running${NC}"
    echo "Start Docker with: sudo systemctl start docker"
    exit 1
fi

echo -e "${GREEN}✓ Docker daemon is running${NC}"

# Check for .env.production file
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ .env.production file not found${NC}"
    echo ""
    echo "Please create .env.production from template:"
    echo "  cp .env.production.example .env.production"
    echo "  nano .env.production  # Edit with your values"
    echo ""
    echo -e "${YELLOW}Generate strong secrets with:${NC}"
    echo "  openssl rand -base64 32  # For passwords"
    echo "  openssl rand -base64 48  # For JWT secret"
    exit 1
fi

echo -e "${GREEN}✓ .env.production file found${NC}"

# Validate critical environment variables
echo ""
echo -e "${YELLOW}Validating environment variables...${NC}"

source .env.production

MISSING_VARS=()

if [[ -z "$POSTGRES_PASSWORD" ]] || [[ "$POSTGRES_PASSWORD" == *"change"* ]] || [[ "$POSTGRES_PASSWORD" == *"your-"* ]]; then
    MISSING_VARS+=("POSTGRES_PASSWORD")
fi

if [[ -z "$JWT_SECRET" ]] || [[ "$JWT_SECRET" == *"change"* ]] || [[ ${#JWT_SECRET} -lt 32 ]]; then
    MISSING_VARS+=("JWT_SECRET (must be at least 32 characters)")
fi

if [[ -z "$MINIO_ROOT_PASSWORD" ]] || [[ "$MINIO_ROOT_PASSWORD" == *"change"* ]] || [[ "$MINIO_ROOT_PASSWORD" == *"your-"* ]]; then
    MISSING_VARS+=("MINIO_ROOT_PASSWORD")
fi

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${RED}❌ Please set the following variables in .env.production:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo -e "${YELLOW}Generate strong secrets with:${NC}"
    echo "  openssl rand -base64 32  # For passwords"
    echo "  openssl rand -base64 48  # For JWT secret"
    exit 1
fi

echo -e "${GREEN}✓ Environment variables validated${NC}"

# Stop existing containers
echo ""
echo -e "${YELLOW}Stopping existing containers...${NC}"
docker compose -f docker-compose.production.yml --env-file .env.production down

# Pull/Build images
echo ""
echo -e "${YELLOW}Building production images...${NC}"
docker compose -f docker-compose.production.yml --env-file .env.production build --no-cache

# Start infrastructure services first
echo ""
echo -e "${YELLOW}Starting infrastructure services...${NC}"
docker compose -f docker-compose.production.yml --env-file .env.production up -d postgres minio

# Wait for databases to be healthy
echo ""
echo -e "${YELLOW}Waiting for databases to be ready...${NC}"
sleep 15

# Run migrations
echo ""
echo -e "${YELLOW}Running database migrations...${NC}"
docker compose -f docker-compose.production.yml --env-file .env.production up migration

# Run database seed
echo ""
echo -e "${YELLOW}Seeding database...${NC}"
docker compose -f docker-compose.production.yml --env-file .env.production up seed

# Start application services
echo ""
echo -e "${YELLOW}Starting application services...${NC}"
docker compose -f docker-compose.production.yml --env-file .env.production up -d backend frontend

# Wait for services to start
echo ""
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 10

# Check container status
echo ""
echo -e "${BLUE}Container Status:${NC}"
docker compose -f docker-compose.production.yml --env-file .env.production ps

# Test health endpoint
echo ""
echo -e "${YELLOW}Testing backend health...${NC}"
sleep 5

if curl -f http://localhost:5000/health &> /dev/null; then
    echo -e "${GREEN}✓ Backend is responding on http://localhost:5000/health${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    echo "Check logs with: docker compose -f docker-compose.production.yml logs backend"
fi

# Check if YOLO model exists
echo ""
echo -e "${YELLOW}Checking YOLO model...${NC}"
if [ -f "server/models/yolo11n.onnx" ]; then
    echo -e "${GREEN}✓ YOLO model found${NC}"
else
    echo -e "${YELLOW}⚠️  YOLO model not found. AI analysis will not work.${NC}"
    echo "Download with: ./download-yolo-model.sh"
fi

# Final status
echo ""
echo "========================================"
echo -e "${GREEN}🎉 Production Deployment Complete!${NC}"
echo ""
echo -e "${BLUE}Access URLs:${NC}"
echo "  Frontend:         http://vps-808bca14.vps.ovh.net"
echo "  Backend API:      http://vps-808bca14.vps.ovh.net:5000/api"
echo "  Health Check:     http://vps-808bca14.vps.ovh.net:5000/health"
echo "  MinIO Console:    http://vps-808bca14.vps.ovh.net:9091"
echo ""
echo -e "${BLUE}Default Credentials:${NC}"
echo "  Email:    admin@hyrexa.com"
echo "  Password: admin123"
echo -e "${RED}  ⚠️  CHANGE ADMIN PASSWORD IMMEDIATELY!${NC}"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "  View logs:        docker compose -f docker-compose.production.yml logs -f"
echo "  View backend:     docker compose -f docker-compose.production.yml logs -f backend"
echo "  Restart:          docker compose -f docker-compose.production.yml restart"
echo "  Stop:             docker compose -f docker-compose.production.yml down"
echo "  Rebuild:          docker compose -f docker-compose.production.yml build --no-cache"
echo ""
echo -e "${YELLOW}Security Reminders:${NC}"
echo "  ✓ Set up SSL/HTTPS (use Caddy or nginx-proxy with Let's Encrypt)"
echo "  ✓ Configure firewall (ufw or iptables)"
echo "  ✓ Change default admin password"
echo "  ✓ Regularly backup database and uploads"
echo "  ✓ Monitor logs for suspicious activity"
