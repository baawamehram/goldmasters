#!/bin/bash
# test-deployment.sh
# Test deployment scripts without actually deploying

set -e

echo "🧪 Testing Deployment Scripts..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Check script syntax
echo -e "${BLUE}Test 1: Checking script syntax...${NC}"
bash -n deploy-services.sh && echo -e "${GREEN}✅ deploy-services.sh syntax OK${NC}" || echo -e "${RED}❌ deploy-services.sh syntax error${NC}"
bash -n restart-services.sh && echo -e "${GREEN}✅ restart-services.sh syntax OK${NC}" || echo -e "${RED}❌ restart-services.sh syntax error${NC}"
bash -n scripts/deploy.sh && echo -e "${GREEN}✅ scripts/deploy.sh syntax OK${NC}" || echo -e "${RED}❌ scripts/deploy.sh syntax error${NC}"
echo ""

# Test 2: Check required commands
echo -e "${BLUE}Test 2: Checking required commands...${NC}"
command -v pnpm >/dev/null 2>&1 && echo -e "${GREEN}✅ pnpm available${NC}" || echo -e "${RED}❌ pnpm not found${NC}"
command -v git >/dev/null 2>&1 && echo -e "${GREEN}✅ git available${NC}" || echo -e "${RED}❌ git not found${NC}"
command -v curl >/dev/null 2>&1 && echo -e "${GREEN}✅ curl available${NC}" || echo -e "${RED}❌ curl not found${NC}"
echo ""

# Test 3: Check pnpm version
echo -e "${BLUE}Test 3: Checking pnpm version...${NC}"
PNPM_VERSION=$(pnpm --version)
REQUIRED_VERSION="8"
if [[ "$PNPM_VERSION" == $REQUIRED_VERSION* ]]; then
    echo -e "${GREEN}✅ pnpm version $PNPM_VERSION (>= $REQUIRED_VERSION)${NC}"
else
    echo -e "${YELLOW}⚠️  pnpm version $PNPM_VERSION (required >= $REQUIRED_VERSION)${NC}"
fi
echo ""

# Test 4: Check git repository
echo -e "${BLUE}Test 4: Checking git repository...${NC}"
if [ -d ".git" ]; then
    echo -e "${GREEN}✅ Git repository found${NC}"
    CURRENT_BRANCH=$(git branch --show-current)
    echo -e "   Current branch: ${YELLOW}$CURRENT_BRANCH${NC}"

    if git diff-index --quiet HEAD --; then
        echo -e "${GREEN}✅ No uncommitted changes${NC}"
    else
        echo -e "${YELLOW}⚠️  Uncommitted changes detected${NC}"
    fi
else
    echo -e "${RED}❌ Not a git repository${NC}"
fi
echo ""

# Test 5: Check package.json scripts
echo -e "${BLUE}Test 5: Checking package.json scripts...${NC}"
for script in "build" "build:web" "build:api" "build:db" "db:generate" "db:migrate" "test" "lint"; do
    if grep -q "\"$script\":" package.json; then
        echo -e "${GREEN}✅ Script '$script' found${NC}"
    else
        echo -e "${RED}❌ Script '$script' not found${NC}"
    fi
done
echo ""

# Test 6: Check database connection (optional)
echo -e "${BLUE}Test 6: Checking database configuration...${NC}"
if [ -f "packages/db/.env" ]; then
    echo -e "${GREEN}✅ Database .env found${NC}"
    if grep -q "DATABASE_URL" packages/db/.env; then
        echo -e "${GREEN}✅ DATABASE_URL configured${NC}"
    else
        echo -e "${YELLOW}⚠️  DATABASE_URL not found in .env${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  packages/db/.env not found${NC}"
fi
echo ""

# Test 7: Test environment variables for restart script
echo -e "${BLUE}Test 7: Checking environment variables for restart-services.sh...${NC}"
if [ -z "$RENDER_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  RENDER_API_KEY not set (required for restart-services.sh)${NC}"
else
    echo -e "${GREEN}✅ RENDER_API_KEY set${NC}"
fi

if [ -z "$RENDER_SERVICE_ID" ]; then
    echo -e "${YELLOW}⚠️  RENDER_SERVICE_ID not set (required for restart-services.sh)${NC}"
else
    echo -e "${GREEN}✅ RENDER_SERVICE_ID set${NC}"
fi

if [ -z "$NETLIFY_SITE_ID" ]; then
    echo -e "${YELLOW}⚠️  NETLIFY_SITE_ID not set (optional for deploy-services.sh)${NC}"
else
    echo -e "${GREEN}✅ NETLIFY_SITE_ID set${NC}"
fi

if [ -z "$NETLIFY_AUTH_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  NETLIFY_AUTH_TOKEN not set (optional for deploy-services.sh)${NC}"
else
    echo -e "${GREEN}✅ NETLIFY_AUTH_TOKEN set${NC}"
fi
echo ""

# Test 8: Test build process (optional - commented out for quick test)
echo -e "${BLUE}Test 8: Testing build commands (dry run)...${NC}"
echo -e "${YELLOW}ℹ️  Skipping actual build to save time${NC}"
echo -e "${YELLOW}ℹ️  To test build, run: pnpm build${NC}"
echo ""

# Summary
echo -e "${GREEN}🎉 Deployment script validation complete!${NC}"
echo ""
echo "📝 Next steps:"
echo "   1. Commit your changes: git add . && git commit -m 'Update deployment scripts'"
echo "   2. Run full deployment: ./deploy-services.sh"
echo "   3. Or restart services: ./restart-services.sh"
echo ""
echo "💡 To run actual deployment test:"
echo "   pnpm install --no-frozen-lockfile"
echo "   pnpm db:generate"
echo "   pnpm build:db"
echo "   pnpm build"
