# VPS Deployment Quick Guide

## Problem
Your VPS can't connect to the backend because Docker containers aren't running on the VPS yet.

## Solution - Deploy to VPS

### Step 1: Upload Files to VPS

From your local machine, sync the project to VPS:

```bash
# Option 1: Using rsync (recommended)
rsync -avz --exclude 'node_modules' --exclude 'dist' --exclude '.git' \
  /home/moetez/Projects/university/hyrexa/ \
  ubuntu@vps-808bca14.vps.ovh.net:~/hyrexa/

# Option 2: Using git (if you have a repo)
# SSH into VPS first, then:
cd ~
git clone <your-repo-url> hyrexa
cd hyrexa
```

### Step 2: Run Deployment Script on VPS

SSH into your VPS and run:

```bash
ssh ubuntu@vps-808bca14.vps.ovh.net

# Navigate to project
cd ~/hyrexa

# Run deployment script
./deploy.sh
```

### Step 3: Manual Deployment (if script fails)

If the script doesn't work, run these commands manually:

```bash
# SSH into VPS
ssh ubuntu@vps-808bca14.vps.ovh.net

# Navigate to project
cd ~/hyrexa

# Install Docker (if not installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Start containers
docker compose up -d --build

# Check status
docker compose ps

# View logs
docker compose logs backend

# Test backend
curl http://localhost:5000/health
```

### Step 4: Verify Deployment

Test from your local machine:

```bash
# Test health endpoint
curl http://vps-808bca14.vps.ovh.net:5000/health

# Should return:
# {"success":true,"message":"Hyrexa API is running","timestamp":"..."}
```

## Common Issues

### 1. Docker Not Installed
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. Permission Denied
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### 3. Containers Not Starting
```bash
# Check logs
docker compose logs

# Restart
docker compose down
docker compose up -d --build
```

### 4. Port Already in Use
```bash
# Find what's using port 5000
sudo lsof -i :5000

# Kill the process
sudo kill -9 <PID>

# Or change port in docker-compose.yml
```

### 5. Database Connection Issues
```bash
# Check postgres logs
docker compose logs postgres

# Restart postgres
docker compose restart postgres

# Wait and restart backend
sleep 5
docker compose restart backend
```

## Environment Variables on VPS

Make sure these files exist on the VPS with correct values:

**`.env` (frontend):**
```bash
VITE_API_URL=http://vps-808bca14.vps.ovh.net:5000/api
VITE_GOOGLE_CLIENT_ID=750369859700-j0h6afrm9g551rbh8ib8ck470kccr0up.apps.googleusercontent.com
```

**`server/.env` (backend):**
```bash
DATABASE_URL=postgresql://hyrexa:hyrexa_dev_password@postgres:5432/hyrexa
JWT_SECRET=hyrexa-super-secret-jwt-key-change-in-production-2024
PORT=5000
NODE_ENV=production
```

## Quick Commands Reference

```bash
# Deploy/Redeploy
cd ~/hyrexa && ./deploy.sh

# View all logs
docker compose logs -f

# View backend logs
docker compose logs -f backend

# Restart everything
docker compose restart

# Stop everything
docker compose down

# Start with rebuild
docker compose up -d --build

# Check status
docker compose ps

# Test backend
curl http://localhost:5000/health
curl http://vps-808bca14.vps.ovh.net:5000/health
```

## Frontend Deployment

After backend is running, deploy the frontend:

```bash
# On VPS
cd ~/hyrexa

# Install Node.js if needed
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Build frontend
npm install
npm run build

# Serve with a simple server
npx serve -s dist -p 5173

# Or use nginx (better for production)
sudo apt install nginx
sudo cp dist/* /var/www/html/
```

## Next Steps After Deployment

1. ✅ Verify backend: `curl http://vps-808bca14.vps.ovh.net:5000/health`
2. ✅ Test login: Try logging in from the frontend
3. ✅ Check logs: `docker compose logs -f`
4. 🔒 Setup SSL/HTTPS with nginx + Let's Encrypt
5. 🔐 Change production secrets and passwords
6. 📊 Setup monitoring and backups

## Need Help?

Check logs:
```bash
docker compose logs backend --tail=100
```

Check container status:
```bash
docker compose ps
```

Restart everything:
```bash
docker compose down && docker compose up -d --build
```
