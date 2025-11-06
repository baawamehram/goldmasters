#!/bin/bash
# restart-services.sh
# Restarts Goldmasters services on Render and triggers Netlify rebuild

set -e

echo "🔄 Restarting Goldmasters Services..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if required environment variables are set
if [ -z "$RENDER_API_KEY" ]; then
    echo -e "${RED}❌ Error: RENDER_API_KEY not set${NC}"
    echo "Please set it with: export RENDER_API_KEY=your_api_key"
    exit 1
fi

if [ -z "$RENDER_SERVICE_ID" ]; then
    echo -e "${RED}❌ Error: RENDER_SERVICE_ID not set${NC}"
    echo "Please set it with: export RENDER_SERVICE_ID=your_service_id"
    exit 1
fi

if [ -z "$NETLIFY_SITE_ID" ]; then
    echo -e "${RED}❌ Error: NETLIFY_SITE_ID not set${NC}"
    echo "Please set it with: export NETLIFY_SITE_ID=your_site_id"
    exit 1
fi

if [ -z "$NETLIFY_AUTH_TOKEN" ]; then
    echo -e "${RED}❌ Error: NETLIFY_AUTH_TOKEN not set${NC}"
    echo "Please set it with: export NETLIFY_AUTH_TOKEN=your_token"
    exit 1
fi

# Restart Render Backend API
echo -e "${BLUE}🔄 Restarting Render backend service...${NC}"
RESTART_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "https://api.render.com/v1/services/${RENDER_SERVICE_ID}/restart" \
  -H "Authorization: Bearer ${RENDER_API_KEY}" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$RESTART_RESPONSE" | tail -n1)
if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
    echo -e "${GREEN}✅ Render service restart triggered${NC}"
else
    echo -e "${RED}❌ Failed to restart Render service (HTTP $HTTP_CODE)${NC}"
    exit 1
fi

echo ""

# Trigger Netlify rebuild
echo -e "${BLUE}🔄 Triggering Netlify frontend rebuild...${NC}"
BUILD_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}/builds" \
  -H "Authorization: Bearer ${NETLIFY_AUTH_TOKEN}")

HTTP_CODE=$(echo "$BUILD_RESPONSE" | tail -n1)
if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
    echo -e "${GREEN}✅ Netlify rebuild triggered${NC}"
else
    echo -e "${RED}❌ Failed to trigger Netlify rebuild (HTTP $HTTP_CODE)${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ All services restarted successfully!${NC}"
echo ""
echo "📝 Note: Builds may take 3-5 minutes to complete"
echo "   - Monitor Render: https://dashboard.render.com/"
echo "   - Monitor Netlify: https://app.netlify.com/"
echo ""
echo "🔍 Health checks:"
echo "   - Backend API: https://goldmasters-api.onrender.com/health"
echo "   - Frontend: https://goldmasters-spotball.netlify.app/"
