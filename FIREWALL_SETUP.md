# Firewall Setup for VPS

Your backend is now correctly configured to accept external connections on port 5000, but you need to open the firewall ports.

## Quick Fix Commands

Run these commands on your **VPS server** (SSH into vps-808bca14.vps.ovh.net):

### For UFW (Ubuntu/Debian)
```bash
# Check if UFW is active
sudo ufw status

# Allow port 5000 (backend API)
sudo ufw allow 5000/tcp

# Allow port 5173 (frontend dev server) - if needed
sudo ufw allow 5173/tcp

# Reload firewall
sudo ufw reload

# Verify
sudo ufw status
```

### For firewalld (CentOS/RHEL)
```bash
# Check status
sudo firewall-cmd --state

# Open port 5000
sudo firewall-cmd --permanent --add-port=5000/tcp

# Open port 5173 (if needed)
sudo firewall-cmd --permanent --add-port=5173/tcp

# Reload
sudo firewall-cmd --reload

# Verify
sudo firewall-cmd --list-ports
```

### For iptables (Manual)
```bash
# Allow port 5000
sudo iptables -A INPUT -p tcp --dport 5000 -j ACCEPT

# Allow port 5173
sudo iptables -A INPUT -p tcp --dport 5173 -j ACCEPT

# Save rules (Ubuntu/Debian)
sudo netfilter-persistent save

# Or on CentOS/RHEL
sudo service iptables save
```

## Verify Backend is Accessible

From your local machine, test if the backend is reachable:

```bash
# Test from your local machine
curl http://vps-808bca14.vps.ovh.net:5000/api/health

# Or use telnet to check if port is open
telnet vps-808bca14.vps.ovh.net 5000
```

## OVH-Specific Firewall

OVH has a **network firewall** separate from the server firewall. You need to configure it:

1. Log in to OVH Control Panel
2. Go to your VPS service
3. Click on "Network" or "Firewall"
4. Add rules to allow:
   - **Port 5000** (TCP) - Backend API
   - **Port 5173** (TCP) - Frontend (if serving directly)
   - **Port 80** (TCP) - HTTP (for production)
   - **Port 443** (TCP) - HTTPS (for production)

## Production Setup (Recommended)

For production, you should use nginx as a reverse proxy with SSL:

### Install nginx
```bash
sudo apt update
sudo apt install nginx
```

### Configure nginx reverse proxy
```bash
sudo nano /etc/nginx/sites-available/hyrexa
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name vps-808bca14.vps.ovh.net;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/hyrexa /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Then update your `.env`:
```bash
VITE_API_URL=http://vps-808bca14.vps.ovh.net/api
```

This way you only need to open ports 80 and 443, not 5000 and 5173.

## Quick Test

After opening the firewall, test immediately:
```bash
curl -v http://vps-808bca14.vps.ovh.net:5000/api/health
```

You should see a response instead of "Connection refused".
