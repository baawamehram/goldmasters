# How to Start the Servers

## The Issue

There's a known issue where running both servers with `pnpm run dev:all` causes the API server to crash immediately after startup. The API receives a SIGINT signal and exits, even though the code is correct.

This appears to be related to how pnpm's parallel execution and/or tsx watch manage process lifecycles on Windows.

## ✅ WORKING SOLUTION: Separate Terminal Windows

Run the servers in **two separate terminal windows**:

### Terminal 1 - API Server
```powershell
cd c:\Users\user\Desktop\wishmasters\apps\api
pnpm dev
```

### Terminal 2 - Web Server
```powershell
cd c:\Users\user\Desktop\wishmasters\apps\web
pnpm dev
```

## What to Expect

**Terminal 1 (API) should show:**
```
🚀 Server running on port 4000
📍 Environment: development
🔗 API Base URL: http://localhost:4000/api/v1
💚 Health check: http://localhost:4000/health
```

**Terminal 2 (Web) should show:**
```
▲ Next.js 16.0.0 (Turbopack)
- Local:        http://localhost:3000
✓ Ready in ~1000ms
```

## Testing the Setup

After both servers are running, test the API:
```powershell
Invoke-WebRequest -Uri 'http://localhost:4000/health' -UseBasicParsing
```

You should get a 200 OK response.

## Using the Checkout Feature

1. Navigate to: http://localhost:3000/competition/1/checkout
2. Place your markers on the image
3. Fill in your entry details
4. Click the "Checkout" button
5. You'll be redirected to the access code entry page
6. Your checkout data is saved and visible in the admin panel

## Admin Panel

View checkout summaries at:
- http://localhost:3000/admin/entries
- Click "View Details" on any entry
- Switch to the "Checkout Summary" tab

## Changes Made to Fix Checkout

The following code changes were made to implement and stabilize the checkout feature:

1. **`apps/api/src/index.ts`**
   - Added comprehensive error handlers for uncaught exceptions and unhandled rejections
   - Added SIGTERM and SIGINT handlers for graceful shutdown
   - Removed default export to prevent module reload issues with tsx watch

2. **`apps/api/package.json`**
   - Updated dev script to: `"dev": "tsx watch --clear-screen=false src/index.ts"`
   - Added `--clear-screen=false` flag to prevent terminal clearing issues

3. **Checkout functionality is fully implemented**:
   - Frontend: `apps/web/src/app/competition/[id]/checkout/page.tsx`
   - Next.js Proxy: `apps/web/src/app/api/v1/competitions/[id]/checkout-summary/route.ts`
   - Express API: `apps/api/src/routes/competition.routes.ts` (lines 930-1037)
   - Admin View: `apps/web/src/components/ViewEntryDetailsModal.tsx`

All code is complete and functional when servers are run separately.
