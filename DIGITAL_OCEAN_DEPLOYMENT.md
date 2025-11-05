# Digital Ocean Self-Hosted Deployment Guide

## Prerequisites
- Digital Ocean account
- Domain name (goldmasters.world)
- SSH key set up

## Step 1: Create Droplet

1. **Create a new Droplet:**
   - OS: Ubuntu 24.04 LTS
   - Plan: Basic (2GB RAM, 1 vCPU minimum)
   - Datacenter: Choose closest to your users
   - Add your SSH key
   - Enable monitoring (optional)

2. **Initial server setup:**
```bash
# SSH into your droplet
ssh root@your_droplet_ip

# Update system
apt update && apt upgrade -y

# Create non-root user
adduser goldmasters
usermod -aG sudo goldmasters
su - goldmasters
```

## Step 2: Install Required Software

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PNPM
sudo npm install -g pnpm@8

# Install Nginx
sudo apt install -y nginx

# Install PM2 for process management
sudo npm install -g pm2

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx

# Install Git
sudo apt install -y git
```

## Step 3: Clone Repository

```bash
cd /home/goldmasters
git clone git@github.com:baawamehram/goldmasters.git
cd goldmasters
```

## Step 4: Configure Environment Variables

```bash
# Create .env files
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
cp .env.example packages/db/.env

# Edit with your production values
nano apps/api/.env
nano apps/web/.env.local
nano packages/db/.env
```

**Important Environment Variables:**

`apps/api/.env`:
```env
DATABASE_URL="postgresql://neondb_owner:npg_MCVEblsQt5x3@ep-fancy-rice-a1koy6k4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="your-production-secret-min-32-chars"
NODE_ENV="production"
PORT="4000"
CORS_ORIGIN="https://goldmasters.world"
```

`apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL="https://goldmasters.world/api/v1"
DATABASE_URL="postgresql://neondb_owner:npg_MCVEblsQt5x3@ep-fancy-rice-a1koy6k4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
NODE_ENV="production"
```

## Step 5: Build Applications

```bash
cd /home/goldmasters/goldmasters

# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm --filter db migrate:deploy

# Build all applications
pnpm build
```

## Step 6: Configure PM2

Create PM2 ecosystem file:

```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'goldmasters-web',
      cwd: '/home/goldmasters/goldmasters/apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'goldmasters-api',
      cwd: '/home/goldmasters/goldmasters/apps/api',
      script: 'dist/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      instances: 1,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M'
    }
  ]
};
```

Start applications:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Step 7: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/goldmasters
```

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name goldmasters.world www.goldmasters.world;

    return 301 https://$server_name$request_uri;
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name goldmasters.world www.goldmasters.world;

    # SSL certificates (will be added by Certbot)
    # ssl_certificate /etc/letsencrypt/live/goldmasters.world/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/goldmasters.world/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Backend API proxy
    location /api/v1/ {
        proxy_pass http://localhost:4000/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Frontend Next.js proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Next.js static files (optional optimization)
    location /_next/static/ {
        proxy_pass http://localhost:3000/_next/static/;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/goldmasters /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 8: Set Up SSL Certificate

```bash
sudo certbot --nginx -d goldmasters.world -d www.goldmasters.world
```

Follow the prompts to set up SSL.

## Step 9: Configure DNS

Point your domain to the Digital Ocean Droplet:

1. Go to your domain registrar (or Digital Ocean DNS)
2. Add/Update A records:
   ```
   A    @    <your_droplet_ip>
   A    www  <your_droplet_ip>
   ```

## Step 10: Configure Firewall

```bash
# Enable UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

## Deployment Commands

### For future updates:

```bash
cd /home/goldmasters/goldmasters

# Pull latest code
git pull origin main

# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm --filter db migrate:deploy

# Build applications
pnpm build

# Restart services
pm2 restart all
```

## Monitoring

```bash
# View logs
pm2 logs

# View specific app logs
pm2 logs goldmasters-web
pm2 logs goldmasters-api

# Monitor resources
pm2 monit

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Backup Strategy

1. **Database backups** (handled by Neon)
2. **Code backups** (in Git repository)
3. **Environment files backup:**
```bash
# Backup .env files
mkdir -p ~/backups
cp apps/api/.env ~/backups/api.env.backup
cp apps/web/.env.local ~/backups/web.env.backup
```

## Performance Optimization

1. **Enable Next.js caching:**
   - Static assets automatically cached
   - Configure Redis for API caching (optional)

2. **Database connection pooling:**
   - Already using Neon pooler (configured in DATABASE_URL)

3. **PM2 cluster mode:**
   - Increase instances in ecosystem.config.js for more CPU cores

## Troubleshooting

```bash
# Check if services are running
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check Nginx configuration
sudo nginx -t

# Restart services
pm2 restart all
sudo systemctl restart nginx

# Check disk space
df -h

# Check memory usage
free -h
```

## Security Checklist

- [ ] SSH key-based authentication only
- [ ] Firewall (UFW) enabled
- [ ] SSL certificate installed
- [ ] Non-root user for deployment
- [ ] Environment variables secured
- [ ] Regular security updates
- [ ] Fail2ban installed (optional)

## Cost Estimate

- **Droplet**: $12-24/month (2-4GB RAM)
- **Database**: Free tier on Neon (or $20/month for production)
- **Domain**: $10-15/year
- **Total**: ~$15-40/month

## Next Steps After Deployment

1. Monitor application performance
2. Set up automated backups
3. Configure monitoring (UptimeRobot, Pingdom)
4. Set up error tracking (Sentry)
5. Configure analytics
