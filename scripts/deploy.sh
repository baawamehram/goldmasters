#!/bin/bash

# Deployment script for Digital Ocean / Self-hosted (PM2)
# NOTE: This is for legacy/self-hosted deployments
# For production, use deploy-services.sh (Netlify + Render)
# Usage: ./scripts/deploy.sh

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Run this script from the project root.${NC}"
    exit 1
fi

# Pull latest code
echo -e "${YELLOW}📥 Pulling latest code from Git...${NC}"
git pull origin main

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
pnpm install --frozen-lockfile

# Generate Prisma client
echo -e "${YELLOW}🔧 Generating Prisma client...${NC}"
pnpm db:generate

# Build database package first
echo -e "${YELLOW}🔨 Building database package...${NC}"
pnpm build:db

# Run database migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
pnpm --filter db migrate:deploy

# Build applications
echo -e "${YELLOW}🏗️  Building applications...${NC}"
pnpm build

# Create logs directory if it doesn't exist
mkdir -p logs

# Restart PM2 processes
echo -e "${YELLOW}♻️  Restarting services...${NC}"
pm2 restart ecosystem.config.js

# Save PM2 process list
pm2 save

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "📊 Service status:"
pm2 status

echo ""
echo "📝 To view logs, run:"
echo "  pm2 logs"
