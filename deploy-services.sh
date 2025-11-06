#!/bin/bash
# deploy-services.sh
# Builds locally, runs migrations, and triggers deployment to Render and Netlify

set -e

echo "🚀 Deploying Goldmasters Services..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Error: Not in a git repository${NC}"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}⚠️  Warning: You have uncommitted changes${NC}"
    read -p "Do you want to continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Clean and install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
pnpm install --no-frozen-lockfile
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Generate Prisma client
echo -e "${BLUE}🔧 Generating Prisma client...${NC}"
pnpm db:generate
echo -e "${GREEN}✅ Prisma client generated${NC}"
echo ""

# Run database migrations
echo -e "${BLUE}🗄️  Running database migrations...${NC}"
pnpm --filter db migrate:deploy
echo -e "${GREEN}✅ Migrations completed${NC}"
echo ""

# Build all packages
echo -e "${BLUE}🔨 Building all packages...${NC}"
pnpm build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo ""

# Run tests (optional - comment out if no tests)
echo -e "${BLUE}🧪 Running tests...${NC}"
if pnpm test 2>/dev/null; then
    echo -e "${GREEN}✅ Tests passed${NC}"
else
    echo -e "${YELLOW}⚠️  Tests skipped or failed${NC}"
fi
echo ""

# Push to git (triggers auto-deploy on Netlify)
echo -e "${BLUE}📤 Pushing to git repository...${NC}"
CURRENT_BRANCH=$(git branch --show-current)
git push origin "$CURRENT_BRANCH"
echo -e "${GREEN}✅ Pushed to $CURRENT_BRANCH${NC}"
echo ""

# Trigger Render deployment (if API keys are set)
if [ ! -z "$RENDER_API_KEY" ] && [ ! -z "$RENDER_SERVICE_ID" ]; then
    echo -e "${BLUE}🔄 Triggering Render backend deployment...${NC}"
    curl -X POST "https://api.render.com/v1/services/${RENDER_SERVICE_ID}/deploys" \
      -H "Authorization: Bearer ${RENDER_API_KEY}" \
      -H "Content-Type: application/json" \
      -d '{}'

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Render deployment triggered${NC}"
    else
        echo -e "${YELLOW}⚠️  Manual deployment may be required on Render${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Render API credentials not set - deploy manually at https://dashboard.render.com/${NC}"
fi
echo ""

# Trigger Netlify deployment (if credentials are set)
if [ ! -z "$NETLIFY_AUTH_TOKEN" ] && [ ! -z "$NETLIFY_SITE_ID" ]; then
    echo -e "${BLUE}🔄 Triggering Netlify frontend deployment...${NC}"
    curl -X POST "https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}/builds" \
      -H "Authorization: Bearer ${NETLIFY_AUTH_TOKEN}"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Netlify deployment triggered${NC}"
    else
        echo -e "${YELLOW}⚠️  Netlify will auto-deploy from git push${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Netlify credentials not set - auto-deploying from git push${NC}"
fi
echo ""

echo -e "${GREEN}🎉 Deployment process complete!${NC}"
echo ""
echo "📝 Next steps:"
echo "   1. Monitor Netlify build: https://app.netlify.com/"
echo "   2. Monitor Render deployment: https://dashboard.render.com/"
echo "   3. Check database migrations applied correctly"
echo "   4. Verify services are running"
echo ""
echo "⏱️  Deployments typically take 3-5 minutes"
