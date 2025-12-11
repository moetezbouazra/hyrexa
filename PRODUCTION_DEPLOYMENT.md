# Production Deployment Guide

## Domain Setup

Your VPS domain: `vps-808bca14.vps.ovh.net`  
IP Address: `151.80.145.44`

## Quick Deployment

### 1. Set Environment Variables in Dockploy

Add these in the Dockploy console for your deployment:

#### Frontend Service
```
VITE_API_URL=http://vps-808bca14.vps.ovh.net:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

#### Backend Service
```
DATABASE_URL=postgresql://hyrexa:YOUR_PASSWORD@postgres:5432/hyrexa
JWT_SECRET=your-very-strong-random-secret-min-32-chars
JWT_EXPIRES_IN=7d
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=hyrexa_admin
MINIO_SECRET_KEY=YOUR_MINIO_PASSWORD
MINIO_BUCKET_NAME=hyrexa-uploads
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://vps-808bca14.vps.ovh.net:5000/api/auth/google/callback
PORT=5000
NODE_ENV=production
FRONTEND_URL=http://vps-808bca14.vps.ovh.net:5173
YOLO_MODEL_PATH=./models/yolo11n.onnx
```

### 2. Deploy with Docker Compose

```bash
# On your VPS
cd /path/to/hyrexa

# Create production env file
cp .env.production.example .env.production
nano .env.production  # Edit with your actual values

# Deploy
docker compose -f docker-compose.production.yml --env-file .env.production up -d

# Check status
docker compose -f docker-compose.production.yml ps

# View logs
docker compose -f docker-compose.production.yml logs -f
```

### 3. Initial Setup

```bash
# Run database migrations
docker compose -f docker-compose.production.yml exec backend npm run prisma:migrate

# Seed database with admin and test users
docker compose -f docker-compose.production.yml exec backend npm run prisma:seed

# Download YOLO model (optional)
./download-yolo-model.sh
docker compose -f docker-compose.production.yml restart backend
```

### 4. Access Your App

- **Frontend**: http://vps-808bca14.vps.ovh.net:5173
- **Backend API**: http://vps-808bca14.vps.ovh.net:5000/api
- **MinIO Console**: http://vps-808bca14.vps.ovh.net:9091

### 5. Default Credentials

After seeding:
- **Admin**: admin@hyrexa.com / admin123
- **Test Users**: user1@test.com / test123 (through user5)

**⚠️ IMPORTANT**: Change admin password immediately after first login!

## Security Checklist

### Must Do Before Going Live:

- [ ] Change default passwords in `.env.production`
- [ ] Generate strong JWT secret (min 32 chars)
- [ ] Set strong database password
- [ ] Set strong MinIO password
- [ ] Configure Google OAuth with production credentials
- [ ] Add your domain to Google OAuth authorized origins
- [ ] Change admin password after first login
- [ ] Set up HTTPS/SSL (see below)
- [ ] Configure firewall rules
- [ ] Set up backups for database and MinIO

### Recommended: Set Up HTTPS

Use a reverse proxy like Nginx or Traefik:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d vps-808bca14.vps.ovh.net

# Update all URLs from http:// to https://
```

## Google OAuth Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to your project → APIs & Services → Credentials
3. Add authorized origins:
   - `http://vps-808bca14.vps.ovh.net:5173`
   - `http://vps-808bca14.vps.ovh.net:5000`
4. Add authorized redirect URIs:
   - `http://vps-808bca14.vps.ovh.net:5000/api/auth/google/callback`
5. Copy Client ID and Secret to environment variables

## Monitoring

### Check Service Status
```bash
docker compose -f docker-compose.production.yml ps
```

### View Logs
```bash
# All services
docker compose -f docker-compose.production.yml logs -f

# Specific service
docker compose -f docker-compose.production.yml logs -f backend
docker compose -f docker-compose.production.yml logs -f frontend
```

### Check Resource Usage
```bash
docker stats
```

## Backup

### Database Backup
```bash
# Backup
docker compose -f docker-compose.production.yml exec postgres pg_dump -U hyrexa hyrexa > backup.sql

# Restore
docker compose -f docker-compose.production.yml exec -T postgres psql -U hyrexa hyrexa < backup.sql
```

### MinIO Backup
```bash
# Backup MinIO data
docker compose -f docker-compose.production.yml exec minio mc mirror /data /backup
```

## Troubleshooting

### Frontend Can't Connect to Backend
- Check `VITE_API_URL` is correct
- Verify backend is running: `curl http://vps-808bca14.vps.ovh.net:5000/api/health`
- Check CORS settings in backend

### Database Connection Issues
- Verify postgres is healthy: `docker compose -f docker-compose.production.yml ps`
- Check DATABASE_URL format
- Ensure postgres container is accessible from backend

### MinIO Issues
- Check MinIO console: http://vps-808bca14.vps.ovh.net:9091
- Login with MINIO_ROOT_USER and MINIO_ROOT_PASSWORD
- Verify bucket exists

### YOLO Model Not Working
- Check if model exists: `ls server/models/yolo11n.onnx`
- Download: `./download-yolo-model.sh`
- Restart backend: `docker compose -f docker-compose.production.yml restart backend`
- App works fine without model (uses mock analysis)

## Updating

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker compose -f docker-compose.production.yml up -d --build

# Run any new migrations
docker compose -f docker-compose.production.yml exec backend npm run prisma:migrate
```

## Stopping Services

```bash
# Stop all services
docker compose -f docker-compose.production.yml down

# Stop and remove volumes (⚠️ deletes data)
docker compose -f docker-compose.production.yml down -v
```

## Environment Variables Reference

### Critical (Must Change)
- `JWT_SECRET` - Authentication secret
- `POSTGRES_PASSWORD` - Database password
- `MINIO_ROOT_PASSWORD` - Storage password

### URLs (Update for your domain)
- `FRONTEND_URL` - Your frontend URL
- `BACKEND_URL` - Your backend URL
- `VITE_API_URL` - API endpoint for frontend

### Optional
- `GOOGLE_CLIENT_ID` - Google OAuth
- `GOOGLE_CLIENT_SECRET` - Google OAuth
- `YOLO_MODEL_PATH` - AI model location

## Performance Tuning

### For Production

Edit `docker-compose.production.yml` to add resource limits:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 2G
        reservations:
          memory: 512M
```

### Database Optimization

```bash
# Increase shared_buffers for better performance
docker compose -f docker-compose.production.yml exec postgres psql -U hyrexa -c "ALTER SYSTEM SET shared_buffers = '256MB';"
docker compose -f docker-compose.production.yml restart postgres
```

## Support

For issues:
1. Check logs: `docker compose -f docker-compose.production.yml logs`
2. Verify environment variables
3. Check firewall rules
4. Test connectivity between services
5. Review GitHub issues
