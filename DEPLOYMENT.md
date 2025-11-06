# Deployment Guide

This document outlines the deployment process for the Goldmasters Spot-the-Ball Competition Platform.

## Architecture Overview

The application is deployed using a **serverless/managed services** architecture:

- **Frontend**: Next.js app on **Netlify** (uses Next.js API routes)
- **Backend API**: Express API on **Render** (alternative/legacy access)
- **Database**: PostgreSQL on **Neon** (managed PostgreSQL with connection pooling)
- **Storage**: AWS S3 (for images and assets)

### Key Points
- The frontend uses **Next.js API routes** (`/app/api/v1/*`) that directly connect to PostgreSQL via Prisma
- The Express backend exists on Render for alternative/legacy access patterns
- Both services connect to the same PostgreSQL database on Neon

## Deployment Scripts

### 1. `deploy-services.sh` (Primary Production Deployment)

**Use this for production deployments.**

This script performs a full deployment workflow:
- Installs dependencies
- Generates Prisma client
- Builds database package
- Runs database migrations
- Builds all packages (web + api)
- Runs tests (if available)
- Pushes to git (triggers Netlify auto-deploy)
- Triggers Render backend deployment (if API keys set)

**Usage:**
```bash
./deploy-services.sh
```

**Required Environment Variables:**
```bash
# Optional - for automated Render deployment
export RENDER_API_KEY="your_render_api_key"
export RENDER_SERVICE_ID="your_render_service_id"

# Optional - for automated Netlify deployment
export NETLIFY_AUTH_TOKEN="your_netlify_token"
export NETLIFY_SITE_ID="your_netlify_site_id"
```

**What it does:**
1. ✅ Validates git repository and checks for uncommitted changes
2. 📦 Installs dependencies with `pnpm install --no-frozen-lockfile`
3. 🔧 Generates Prisma client
4. 🔨 Builds database package first
5. 🗄️ Runs database migrations
6. 🏗️ Builds all packages (web + api)
7. 🧪 Runs tests (optional)
8. 📤 Pushes to git (triggers Netlify auto-deploy)
9. 🔄 Triggers Render backend deployment (if credentials set)

**Expected Duration:** 3-5 minutes

---

### 2. `restart-services.sh` (Quick Restart)

**Use this to restart services without rebuilding.**

This script restarts both Render backend and triggers Netlify rebuild without local build steps.

**Usage:**
```bash
./restart-services.sh
```

**Required Environment Variables:**
```bash
export RENDER_API_KEY="your_render_api_key"
export RENDER_SERVICE_ID="your_render_service_id"
export NETLIFY_SITE_ID="your_netlify_site_id"
export NETLIFY_AUTH_TOKEN="your_netlify_token"
```

**What it does:**
1. 🔄 Restarts Render backend service via API
2. 🔄 Triggers Netlify frontend rebuild via API
3. Provides health check URLs

**When to use:**
- After environment variable changes
- After configuration updates
- When services are unresponsive

---

### 3. `scripts/deploy.sh` (Legacy Self-hosted)

**⚠️ LEGACY: For Digital Ocean / PM2 deployments only**

This script is for self-hosted deployments using PM2 process manager. **Not used in current production setup.**

**Usage:**
```bash
./scripts/deploy.sh
```

**What it does:**
1. Pulls latest code from git
2. Installs dependencies
3. Generates Prisma client
4. Builds database package
5. Runs migrations
6. Builds applications
7. Restarts PM2 processes

---

### 4. `apps/web/scripts/post-build.sh` (Automatic)

**This runs automatically after web builds.**

Copies static files and public assets to the Next.js standalone directory. Required for Next.js standalone mode to serve static files correctly.

**What it does:**
- Copies `.next/static` to standalone directory
- Copies `public` assets to standalone directory

**Note:** This is called automatically by the build process, no manual execution needed.

---

## Deployment Workflow

### Standard Production Deployment

1. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Your commit message"
   ```

2. **Run deployment script:**
   ```bash
   ./deploy-services.sh
   ```

3. **Monitor deployments:**
   - Netlify: https://app.netlify.com/
   - Render: https://dashboard.render.com/

4. **Verify deployments:**
   - Frontend: https://goldmasters-spotball.netlify.app/
   - Backend API: https://goldmasters-api.onrender.com/health

### Quick Restart (No Code Changes)

If you only need to restart services (e.g., after env var changes):

```bash
./restart-services.sh
```

### Database Migrations Only

To run only database migrations:

```bash
pnpm --filter db migrate:deploy
```

---

## Environment Setup

### Netlify Environment Variables

Set these in Netlify dashboard (Site settings → Environment variables):

```bash
# Database
DATABASE_URL="postgresql://..."

# Admin
ADMIN_USERNAME="admin"
ADMIN_PASSWORD_HASH="$2b$10$..."

# JWT
JWT_SECRET="your_jwt_secret"
REFRESH_TOKEN_SECRET="your_refresh_token_secret"

# AWS S3
AWS_ACCESS_KEY_ID="your_aws_access_key"
AWS_SECRET_ACCESS_KEY="your_aws_secret"
AWS_REGION="ap-southeast-1"
AWS_S3_BUCKET="goldmasters-spotball"

# Optional: Logging
LOG_LEVEL="info"
```

### Render Environment Variables

Set these in Render dashboard (Service → Environment):

```bash
# Same as Netlify, plus:
PORT="4000"
NODE_ENV="production"

# CORS (allow Netlify frontend)
ALLOWED_ORIGINS="https://goldmasters-spotball.netlify.app"
```

---

## Build Configuration

### Netlify Build Settings

- **Build command:** `pnpm install --no-frozen-lockfile && pnpm -w run db:generate && pnpm run build`
- **Publish directory:** `apps/web/.next`
- **Node version:** 20.10.0 (set in `.nvmrc` or Netlify config)

### Render Build Settings

- **Build command:** `pnpm install && pnpm build:db && pnpm build:api`
- **Start command:** `pnpm start:api`
- **Node version:** 20.10.0

---

## Troubleshooting

### Build Failures

**Prisma client not generated:**
```bash
pnpm db:generate
```

**Dependencies out of sync:**
```bash
pnpm install --no-frozen-lockfile
```

**Database migration issues:**
```bash
# Check migration status
pnpm --filter db migrate:status

# Deploy pending migrations
pnpm --filter db migrate:deploy
```

### Deployment Failures

**Netlify build fails:**
1. Check build logs in Netlify dashboard
2. Ensure DATABASE_URL is set correctly
3. Verify all environment variables are set
4. Check Node version matches requirements (>= 20.10.0)

**Render deployment fails:**
1. Check logs in Render dashboard
2. Ensure all environment variables are set
3. Verify DATABASE_URL connection string is correct
4. Check that CORS origins include Netlify URL

### Service Restarts

**Services not responding:**
```bash
./restart-services.sh
```

**Database connection issues:**
- Check DATABASE_URL is correct
- Verify Neon database is running
- Ensure connection pooling is enabled (`sslmode=require`)

---

## Health Checks

After deployment, verify services are running:

**Frontend:**
```bash
curl https://goldmasters-spotball.netlify.app/
```

**Backend API:**
```bash
curl https://goldmasters-api.onrender.com/health
```

**Database:**
```bash
# From local machine
pnpm --filter db studio
```

---

## Rollback Procedure

If deployment fails and you need to rollback:

### Netlify Rollback
1. Go to Netlify dashboard → Deploys
2. Find the previous successful deploy
3. Click "Publish deploy" to rollback

### Render Rollback
1. Go to Render dashboard → Service → Deploys
2. Find the previous successful deploy
3. Click "Deploy" to rollback

### Database Rollback
```bash
# Revert last migration
pnpm --filter db migrate:resolve --rolled-back migration_name
```

---

## Monitoring

### Logs

**Netlify Function Logs:**
```bash
# Via Netlify CLI
netlify logs:function
```

**Render Logs:**
- View in Render dashboard → Logs
- Or via Render CLI

**Database Logs:**
- View in Neon dashboard → Monitoring

### Performance Monitoring

- **Frontend:** Netlify Analytics
- **Backend:** Render Metrics
- **Database:** Neon Monitoring

---

## Security Notes

- Never commit `.env` files
- Rotate secrets regularly
- Use environment-specific credentials
- Enable 2FA on all service accounts
- Review Render/Netlify access logs periodically

---

## Support

For deployment issues:
1. Check service status dashboards (Netlify, Render, Neon)
2. Review deployment logs
3. Verify environment variables
4. Check database connectivity
5. Review recent commits for breaking changes

**Service URLs:**
- Netlify Dashboard: https://app.netlify.com/
- Render Dashboard: https://dashboard.render.com/
- Neon Dashboard: https://console.neon.tech/

---

## Quick Reference

```bash
# Full deployment
./deploy-services.sh

# Quick restart
./restart-services.sh

# Database migrations
pnpm --filter db migrate:deploy

# Generate Prisma client
pnpm db:generate

# Build everything
pnpm build

# Local development
pnpm dev
```
