# Production Deployment Guide - Quick Reference

## 🚀 Quick Start

### 1. Prerequisites on VPS
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

### 2. Deploy to VPS

**Option A: Using the deployment script (Recommended)**
```bash
# SSH to VPS
ssh ubuntu@vps-808bca14.vps.ovh.net

# Clone or sync project
cd ~/hyrexa

# Copy and configure environment
cp .env.production.example .env.production
nano .env.production  # Edit with your values

# Run production deployment
./deploy-production.sh
```

**Option B: Manual deployment**
```bash
# Generate strong secrets
openssl rand -base64 48  # For JWT_SECRET
openssl rand -base64 32  # For passwords

# Edit .env.production with real values
nano .env.production

# Deploy
docker compose -f docker-compose.production.yml --env-file .env.production up -d --build

# Check status
docker compose -f docker-compose.production.yml ps
docker compose -f docker-compose.production.yml logs -f
```

## 📋 What's Included in Production Setup

### Docker Services
- **PostgreSQL**: Database with automatic migrations
- **MinIO**: Object storage for images
- **Backend**: Node.js API (built and optimized)
- **Frontend**: React app served by Nginx
- **Migration**: Init container for database schema
- **Seed**: Init container for initial data

### Key Features
✅ Multi-stage Docker builds (smaller images)
✅ Automatic database migrations on startup
✅ Database seeding with admin user
✅ Production-optimized builds
✅ Health checks for all services
✅ Persistent volumes for data
✅ Isolated network
✅ Graceful restarts
✅ Log management

## 🔐 Required Environment Variables

Create `.env.production` with these values:

```bash
# Database - CHANGE THIS!
POSTGRES_PASSWORD=your_strong_password_here

# JWT - CHANGE THIS! (min 32 characters)
JWT_SECRET=your_very_strong_jwt_secret_here

# MinIO - CHANGE THIS!
MINIO_ROOT_USER=hyrexa_admin
MINIO_ROOT_PASSWORD=your_strong_password_here

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# URLs (update with your domain)
BACKEND_URL=http://vps-808bca14.vps.ovh.net:5000
FRONTEND_URL=http://vps-808bca14.vps.ovh.net
VITE_API_URL=http://vps-808bca14.vps.ovh.net:5000/api
```

## 🌐 Access URLs

After deployment:
- **Frontend**: http://vps-808bca14.vps.ovh.net (port 80)
- **Backend**: http://vps-808bca14.vps.ovh.net:5000
- **API Docs**: http://vps-808bca14.vps.ovh.net:5000/api
- **MinIO Console**: http://vps-808bca14.vps.ovh.net:9091

## 👤 Default Login

After seeding:
- **Email**: admin@hyrexa.com
- **Password**: admin123

**⚠️ IMPORTANT**: Change password immediately after first login!

## 🔧 Common Commands

```bash
# View all logs
docker compose -f docker-compose.production.yml logs -f

# View specific service logs
docker compose -f docker-compose.production.yml logs -f backend
docker compose -f docker-compose.production.yml logs -f frontend

# Restart services
docker compose -f docker-compose.production.yml restart

# Stop all services
docker compose -f docker-compose.production.yml down

# Rebuild and redeploy
docker compose -f docker-compose.production.yml build --no-cache
docker compose -f docker-compose.production.yml up -d

# Check service status
docker compose -f docker-compose.production.yml ps

# Execute commands in containers
docker compose -f docker-compose.production.yml exec backend sh
docker compose -f docker-compose.production.yml exec postgres psql -U hyrexa

# Database operations
docker compose -f docker-compose.production.yml exec backend npx prisma migrate deploy
docker compose -f docker-compose.production.yml exec backend npx prisma db seed
docker compose -f docker-compose.production.yml exec backend npx prisma studio
```

## 🔄 Updating the Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.production.yml build --no-cache
docker compose -f docker-compose.production.yml up -d

# Run new migrations if any
docker compose -f docker-compose.production.yml exec backend npx prisma migrate deploy
```

## 💾 Backup

```bash
# Backup database
docker compose -f docker-compose.production.yml exec postgres pg_dump -U hyrexa hyrexa > backup_$(date +%Y%m%d).sql

# Backup uploaded files (MinIO data)
docker compose -f docker-compose.production.yml exec minio mc mirror /data ./minio_backup

# Or backup volumes directly
docker run --rm -v hyrexa_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
docker run --rm -v hyrexa_minio_data:/data -v $(pwd):/backup alpine tar czf /backup/minio_backup.tar.gz /data
```

## 🛡️ Security Checklist

Before going live:
- [ ] Change all default passwords in `.env.production`
- [ ] Generate strong JWT secret (min 48 chars)
- [ ] Set up HTTPS/SSL certificates
- [ ] Configure firewall rules (see FIREWALL_SETUP.md)
- [ ] Update Google OAuth with production URLs
- [ ] Change admin password after first login
- [ ] Disable unnecessary ports
- [ ] Set up automated backups
- [ ] Configure log rotation
- [ ] Enable fail2ban
- [ ] Set up monitoring/alerts

## 🔥 Firewall Configuration

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow backend (if needed publicly)
sudo ufw allow 5000/tcp

# Allow MinIO console (optional, better to use SSH tunnel)
sudo ufw allow 9091/tcp

# Enable firewall
sudo ufw enable
sudo ufw status
```

## 🚨 Troubleshooting

### Services won't start
```bash
# Check logs
docker compose -f docker-compose.production.yml logs

# Check specific service
docker compose -f docker-compose.production.yml logs backend

# Rebuild from scratch
docker compose -f docker-compose.production.yml down -v
docker compose -f docker-compose.production.yml build --no-cache
docker compose -f docker-compose.production.yml up -d
```

### Database issues
```bash
# Check if postgres is running
docker compose -f docker-compose.production.yml ps postgres

# Connect to database
docker compose -f docker-compose.production.yml exec postgres psql -U hyrexa

# Reset database (DANGER: deletes all data!)
docker compose -f docker-compose.production.yml down -v
docker compose -f docker-compose.production.yml up -d
```

### Frontend not updating
```bash
# Clear browser cache
# Or rebuild frontend
docker compose -f docker-compose.production.yml build --no-cache frontend
docker compose -f docker-compose.production.yml up -d frontend
```

## 📊 Monitoring

```bash
# View resource usage
docker stats

# Check disk space
df -h

# Check container health
docker compose -f docker-compose.production.yml ps
```

## 🎯 Performance Tips

1. **Use a reverse proxy** (Nginx/Caddy) for SSL and load balancing
2. **Enable Gzip compression** (already configured in Nginx)
3. **Set up CDN** for static assets
4. **Configure database indexes** for frequently queried fields
5. **Monitor and optimize** slow queries
6. **Set up Redis** for caching (future enhancement)
7. **Use PM2 or similar** for backend process management (if not using Docker)

## 📚 Additional Resources

- [FIREWALL_SETUP.md](./FIREWALL_SETUP.md) - Detailed firewall configuration
- [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) - OAuth setup guide
- [VPS_DEPLOYMENT.md](./VPS_DEPLOYMENT.md) - Detailed VPS setup
- [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) - Full deployment guide
