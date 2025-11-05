# Database Migration Guide

## Overview
This guide will help you migrate from the file-based mockDb system to the actual PostgreSQL database using Prisma ORM. This migration ensures that user entries created in production will be stored in the database and visible in the admin dashboard.

## What's Changed

### 1. **New Database Models Added**
The following models have been added to the Prisma schema (`packages/db/prisma/schema.prisma`):

- **UserEntry**: Stores user login information and access codes
- **CheckoutSummary**: Stores complete checkout data with markers
- **CompetitionResult**: Stores computed competition winners and results

### 2. **New Database Service Layer**
Created `apps/api/src/data/db.service.ts` that:
- Implements all mockDb functions using Prisma
- Maintains the exact same API interface (no breaking changes)
- Stores data in PostgreSQL instead of JSON files

### 3. **No Logic Changes**
✅ **All existing functionality preserved**
✅ **No changes to business logic**
✅ **Same API endpoints and responses**
✅ **Backward compatible with existing code**

## Migration Steps

### Step 1: Stop All Running Servers

Stop all running development servers:
- API server (port 4000)
- Web server (port 3000)

Press `Ctrl+C` in the terminals running the servers.

### Step 2: Regenerate Prisma Client

```powershell
cd packages/db
pnpm prisma generate
cd ../..
```

This will generate the Prisma client with the new models (UserEntry, CheckoutSummary, CompetitionResult).

### Step 3: Create Database Migration

```powershell
cd packages/db
pnpm prisma migrate dev --name add-user-checkout-results
cd ../..
```

This will:
- Create a new migration file
- Apply the migration to your database
- Create the new tables: `user_entries`, `checkout_summaries`, `competition_results`

### Step 4: Update Route Imports (Done Automatically)

The route files will be updated to use the new database service:
- `apps/api/src/routes/competition.routes.ts`
- `apps/api/src/routes/admin.routes.ts`
- `apps/api/src/routes/participant.routes.ts`

All `mockDb` imports will be replaced with `db.service` imports.

### Step 5: Restart Servers

```powershell
# Terminal 1 - API Server
cd apps/api
pnpm dev

# Terminal 2 - Web Server  
cd apps/web
pnpm dev
```

## What Happens to Existing Data?

### In Local Development
- Existing data in `.data/` folder (JSON files) will **remain intact**
- The first time you create a new entry, it will be stored in the database
- Old entries won't be migrated automatically (they exist only in files)

### In Production
- Production already uses the real database for competitions and participants
- User entries will now be stored in the database
- Checkout summaries will be stored in the database
- Admin dashboard will show all entries from the database

## Benefits of This Migration

1. **✅ Data Persistence**: User entries persist across server restarts
2. **✅ Production Ready**: Same behavior in development and production
3. **✅ Scalability**: Database can handle thousands of concurrent users
4. **✅ Data Integrity**: ACID transactions ensure data consistency
5. **✅ Admin Dashboard**: All entries visible in real-time
6. **✅ Backup & Recovery**: Database backups protect your data

## Verification Steps

After migration, verify everything works:

### 1. Test User Entry Creation
```bash
# Run the test script
.\test-complete-flow.ps1
```

### 2. Check Admin Dashboard
- Navigate to `http://localhost:3000/admin`
- Login with admin credentials
- Verify that new user entries appear in the participants list

### 3. Test Checkout Flow
- Create a new user entry
- Submit markers
- Complete checkout
- Verify entry appears in admin dashboard

## Troubleshooting

### Issue: Prisma Generate Fails
**Error**: `EPERM: operation not permitted`

**Solution**: 
1. Stop all running Node.js processes
2. Close VS Code
3. Reopen VS Code
4. Run `pnpm prisma generate` again

### Issue: Migration Fails
**Error**: `Database connection failed`

**Solution**:
1. Verify `DATABASE_URL` in `.env` is correct
2. Check database is accessible
3. Run `pnpm prisma db push` to sync schema

### Issue: Old Data Not Showing
**Expected Behavior**: Old data in JSON files won't automatically migrate to the database. Only new entries will be stored in the database.

**To Migrate Old Data** (Optional):
Create a migration script to read from JSON files and insert into the database.

## Database Schema Reference

### UserEntry Table
```sql
CREATE TABLE user_entries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  assigned_tickets INTEGER DEFAULT 0,
  is_logged_in BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMP,
  last_logout_at TIMESTAMP,
  access_code TEXT UNIQUE NOT NULL,
  current_phase INTEGER
);
```

### CheckoutSummary Table
```sql
CREATE TABLE checkout_summaries (
  id TEXT PRIMARY KEY,
  competition_id TEXT NOT NULL,
  participant_id TEXT NOT NULL,
  user_id TEXT,
  summary_data JSONB NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(competition_id, participant_id)
);
```

### CompetitionResult Table
```sql
CREATE TABLE competition_results (
  id TEXT PRIMARY KEY,
  competition_id TEXT UNIQUE NOT NULL,
  final_judge_x FLOAT NOT NULL,
  final_judge_y FLOAT NOT NULL,
  winners JSONB NOT NULL,
  computed_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Rollback Plan

If you need to rollback to the old system:

1. Stop servers
2. Restore the original `mockDb.ts` imports in route files
3. Restart servers
4. Old JSON file system will work as before

## Support

If you encounter any issues during migration:
1. Check the error logs in the terminal
2. Verify database connection string
3. Ensure all migrations are applied
4. Check that Prisma client is generated

## Next Steps

After successful migration:
1. ✅ Monitor the admin dashboard for new entries
2. ✅ Verify production deployment works correctly
3. ✅ Consider adding database backups
4. ✅ Optionally migrate old JSON data to database
