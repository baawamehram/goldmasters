# Vercel Deployment Guide

## Step 1: Root Directory Setting
In Vercel dashboard, set **Root Directory** to: `apps/web`

## Step 2: Build Settings
The `vercel.json` is already configured with:
- **Build Command**: `cd ../.. && pnpm install && pnpm run db:generate && cd apps/web && pnpm build`
- **Output Directory**: `.next`
- **Install Command**: `cd ../.. && pnpm install`
- **Framework**: Next.js

## Step 3: Environment Variables
Add these environment variables in Vercel Dashboard:

### Required:
```
DATABASE_URL=postgresql://neondb_owner:npg_MCVEblsQt5x3@ep-fancy-rice-a1koy6k4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars

NODE_ENV=production
```

### Optional (if using S3):
```
S3_BUCKET=wishmasters-spotball
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-aws-access-key-id
S3_SECRET_ACCESS_KEY=your-aws-secret-access-key
```

### Optional (CORS):
```
CORS_ORIGIN=https://your-domain.vercel.app
```

## Step 4: Deploy
Click the **Deploy** button in Vercel!

## Troubleshooting
- If build fails, check that `pnpm` is being used (not npm or yarn)
- Ensure all environment variables are set
- Check that Root Directory is set to `apps/web`
