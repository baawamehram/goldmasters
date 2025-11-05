# Wishmasters Spot-the-Ball - Environment Configuration

This document describes all environment variables used across the project.

## 📁 Environment Files

```
/
├── .env.example              # Root-level example (reference)
├── apps/
│   ├── api/
│   │   ├── .env             # Backend environment (local, not committed)
│   │   └── .env.example     # Backend template (committed)
│   └── web/
│       ├── .env.local       # Frontend environment (local, not committed)
│       └── .env.example     # Frontend template (committed)
└── packages/
    └── db/
        └── .env             # Database URL (inherits from root or apps/api)
```

## 🔧 Backend API Variables (`apps/api/.env`)

### Server Configuration
```env
NODE_ENV=development          # development | production | test
PORT=4000                     # API server port
API_VERSION=v1                # API version for routing
```

### Database Configuration
```env
DATABASE_URL="postgresql://user:password@localhost:5432/wishmasters_db?schema=public"
```
**Format:** `postgresql://[user]:[password]@[host]:[port]/[database]?schema=public`

**Production Example:**
```env
DATABASE_URL="postgresql://wishmasters_user:secure_password@db.example.com:5432/wishmasters_prod?schema=public"
```

### JWT Configuration
```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=7d             # Token expiration (7d, 24h, 60m)
JWT_REFRESH_EXPIRES_IN=30d    # Refresh token expiration
```
⚠️ **Security:** JWT_SECRET must be at least 32 characters in production

### AWS S3 Configuration
```env
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-aws-access-key-id
S3_SECRET_ACCESS_KEY=your-aws-secret-access-key
S3_BUCKET=wishmasters-spotball
```
**Purpose:** Image uploads (competition images, judge reference videos)

### CORS Configuration
```env
CORS_ORIGIN=http://localhost:3000
```
**Production:** Set to your frontend domain (e.g., `https://wishmasters.com`)

### Rate Limiting
```env
RATE_LIMIT_WINDOW_MS=900000   # 15 minutes in milliseconds
RATE_LIMIT_MAX_REQUESTS=100   # Max requests per window
```

### Admin Credentials (Development Only)
```env
ADMIN_EMAIL=admin@wishmasters.com
ADMIN_PASSWORD=admin123
```
⚠️ **Change in production!** Use strong passwords and proper admin management.

### Password Encryption
```env
COMPETITION_PASSWORD_SALT_ROUNDS=10
```
**Higher = more secure but slower** (10-12 recommended)

---

## 🌐 Frontend Variables (`apps/web/.env.local`)

### API Configuration
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```
**Production:** Set to your API domain (e.g., `https://api.wishmasters.com/api/v1`)

### AWS S3 Configuration (Public)
```env
NEXT_PUBLIC_S3_BUCKET=wishmasters-spotball
NEXT_PUBLIC_S3_REGION=us-east-1
```
**Purpose:** Display images from S3 (read-only, public URLs)

### Application Configuration
```env
NEXT_PUBLIC_APP_NAME=Wishmasters Spot-the-Ball
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🗄️ Database Package (`packages/db`)

The `db` package inherits `DATABASE_URL` from the backend API `.env` file.

No separate `.env` needed unless running database operations independently.

---

## 🚀 Setup Instructions

### 1. Backend Setup

```bash
cd apps/api
cp .env.example .env
# Edit .env with your actual credentials
```

### 2. Frontend Setup

```bash
cd apps/web
cp .env.example .env.local
# Edit .env.local with your actual API URL
```

### 3. Root Level (Optional)

```bash
cp .env.example .env
# For workspace-level tools or scripts
```

---

## 🔐 Security Best Practices

### ✅ DO:
- Use strong, unique JWT_SECRET (32+ characters)
- Change default admin credentials in production
- Use environment-specific files (.env.local, .env.production)
- Keep .env files out of version control (.gitignore)
- Use AWS IAM roles with minimal permissions
- Enable S3 bucket policies for public read, authenticated write
- Rotate credentials regularly

### ❌ DON'T:
- Commit .env files to Git
- Use default passwords in production
- Share credentials in plain text
- Use the same JWT_SECRET across environments
- Grant full S3 access (use scoped permissions)

---

## 📦 Production Deployment

### Backend (AWS EC2 / Render / DigitalOcean)
1. Set environment variables in hosting platform
2. Never commit production `.env` files
3. Use secrets management (AWS Secrets Manager, HashiCorp Vault)
4. Enable HTTPS and update `CORS_ORIGIN`

### Frontend (Vercel)
1. Add environment variables in Vercel dashboard
2. Prefix public variables with `NEXT_PUBLIC_`
3. Use preview/production environment separation

### Database (AWS RDS / Supabase)
1. Use connection pooling
2. Enable SSL (`?sslmode=require` in DATABASE_URL)
3. Whitelist backend server IPs
4. Enable automated backups

---

## 🧪 Testing Environments

### Development
```env
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/wishmasters_dev
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

### Staging
```env
NODE_ENV=production
DATABASE_URL=postgresql://staging-db.example.com:5432/wishmasters_staging
NEXT_PUBLIC_API_URL=https://api-staging.wishmasters.com/api/v1
```

### Production
```env
NODE_ENV=production
DATABASE_URL=postgresql://prod-db.example.com:5432/wishmasters_prod
NEXT_PUBLIC_API_URL=https://api.wishmasters.com/api/v1
```

---

## 📋 Validation

Before deployment, verify:

- [ ] All required variables are set
- [ ] JWT_SECRET is strong (32+ chars)
- [ ] Database connection works
- [ ] S3 credentials are valid
- [ ] CORS_ORIGIN matches frontend domain
- [ ] Admin password is changed from default
- [ ] Rate limits are appropriate
- [ ] Frontend can reach backend API

---

## 🔗 Related Files

- Backend API: `apps/api/README.md`
- Frontend: `apps/web/README.md`
- Database: `packages/db/README.md`
- Root: `README.md`
