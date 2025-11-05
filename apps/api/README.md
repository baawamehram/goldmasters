# Wishmasters Spot-the-Ball - Backend API

Express + TypeScript backend API for the Wishmasters Spot-the-Ball competition platform.

## 🚀 Tech Stack

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **TypeScript** - Type-safe development
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Prisma** (to be integrated) - ORM for PostgreSQL
- **express-validator** - Request validation

## 📁 Project Structure

```
src/
├── index.ts              # Main app entry point
├── middleware/
│   ├── auth.ts          # JWT authentication & authorization
│   ├── errorHandler.ts  # Global error handling
│   └── notFoundHandler.ts # 404 handler
└── routes/
    ├── competition.routes.ts  # Competition endpoints
    ├── participant.routes.ts  # Participant endpoints
    └── admin.routes.ts        # Admin endpoints
```

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Run development server (with hot reload)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

## 🌐 API Endpoints

### Public Endpoints

#### Competitions
- `GET /api/v1/competitions` - Get all active competitions
- `GET /api/v1/competitions/:id` - Get competition by ID
- `POST /api/v1/competitions/:id/verify-password` - Verify competition password
- `POST /api/v1/competitions/:id/entries` - Submit competition entry

#### Participants
- `POST /api/v1/participants/register` - Register participant
- `GET /api/v1/participants/:id/entries` - Get participant entries
- `POST /api/v1/participants/checkout` - Process ticket purchase

#### Admin
- `POST /api/v1/admin/login` - Admin login (returns JWT)

### Protected Endpoints (Admin Only)

Requires `Authorization: Bearer <token>` header

- `POST /api/v1/admin/competitions` - Create competition
- `POST /api/v1/admin/competitions/:id/judges` - Submit judge coordinates
- `GET /api/v1/admin/competitions/:id/results` - Get competition results
- `GET /api/v1/admin/dashboard/stats` - Get dashboard statistics

## 🔐 Authentication

### Admin Login
```bash
POST /api/v1/admin/login
Content-Type: application/json

{
  "email": "admin@wishmasters.com",
  "password": "admin123"
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "email": "admin@wishmasters.com",
      "role": "ADMIN"
    }
  }
}
```

### Using JWT Token
```bash
GET /api/v1/admin/dashboard/stats
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📄 Environment Variables

Copy `.env.example` to `.env` and configure:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000
```

## 🧪 Testing Endpoints

### Health Check
```bash
curl http://localhost:4000/health
```

### Get All Competitions
```bash
curl http://localhost:4000/api/v1/competitions
```

### Admin Login
```bash
curl -X POST http://localhost:4000/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@wishmasters.com","password":"admin123"}'
```

## 🔒 Security Features

- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate limiting** (to be added)
- **Input validation** - express-validator
- **JWT authentication** - Secure token-based auth
- **bcrypt** - Password hashing

## 🚢 Deployment

Configure for deployment on:
- AWS EC2
- AWS ECS
- Render
- DigitalOcean

### Production Checklist
- [ ] Set strong JWT_SECRET
- [ ] Configure production DATABASE_URL
- [ ] Set up AWS S3 credentials
- [ ] Enable HTTPS
- [ ] Configure rate limiting
- [ ] Set up error logging (Sentry, etc.)
- [ ] Configure database backups

## 📝 TODO

- [ ] Integrate Prisma ORM
- [ ] Implement bcrypt password hashing
- [ ] Add rate limiting
- [ ] Set up error logging
- [ ] Add API documentation (Swagger)
- [ ] Write unit tests
- [ ] Add database migrations

## 🔗 Related

- Frontend: `../web`
- Database: `../../packages/db`
