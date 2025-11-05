# Wishmasters Spot-the-Ball Competition Platform

A private, invite-only Spot-the-Ball competition platform where users enter via password-protected links to play skill-based competitions using images.

## 🎯 Project Overview

**Concept:** Limited-ticket competitions where participants place markers on images (e.g., cricket scenes with ball removed). Judges externally determine the winning coordinates, and the system automatically computes winners based on proximity.

## 🧱 Tech Stack

### Frontend
- **Next.js** (TypeScript) - React framework with SSR/SSG
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Re-usable component library
- **Framer Motion** - Animations
- **Konva.js** - Canvas manipulation for marker placement

### Backend
- **Node.js + Express** (TypeScript) - REST API
- **Prisma** - Type-safe ORM
- **PostgreSQL** - Primary database
- **JWT** - Admin authentication
- **bcrypt** - Password hashing

### Infrastructure
- **AWS S3** - Image and video storage
- **Vercel** - Frontend hosting
- **AWS EC2 / Render** - Backend hosting

## 📁 Monorepo Structure

```
wishmasters-spotball/
├── apps/
│   ├── web/              # Next.js frontend application
│   └── api/              # Express backend API
├── packages/
│   └── db/               # Prisma schema and database utilities
├── infra/                # Deployment configurations and scripts
├── package.json          # Root workspace configuration
├── pnpm-workspace.yaml   # PNPM workspace definition
└── README.md             # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- PNPM >= 8.0.0
- PostgreSQL database

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wishmasters-spotball
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Setup environment variables**
   - Copy `.env.example` to `.env` in each app directory
   - Fill in required credentials (database, AWS, JWT secrets)

4. **Setup database**
   ```bash
   pnpm db:generate
   pnpm db:push
   ```

5. **Run development servers**
   ```bash
   pnpm dev
   ```
   - Frontend: http://localhost:3000
   - Backend: http://localhost:4000

## 📦 Available Scripts

### Root Level
- `pnpm dev` - Run all apps in development mode
- `pnpm dev:web` - Run frontend only
- `pnpm dev:api` - Run backend only
- `pnpm build` - Build all apps
- `pnpm test` - Run tests across all packages
- `pnpm lint` - Lint all packages
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push schema to database
- `pnpm db:migrate` - Run database migrations

## 🎮 Key Features

### User Flow
- Password-protected competition access
- Limited ticket purchases (e.g., 55, 88, 111)
- Each ticket = 3 marker placements (customizable)
- Real-time marker placement on canvas
- Secure checkout flow
- Competition auto-closes when full

### Admin Features
- Competition creation and management
- Ticket limit configuration
- Pre-assign tickets to users
- Manual judge coordinate input
- Automatic winner computation
- Result publishing
- CSV export and audit logs

### Judging System
- External judging (not in-app)
- Admin manually enters final coordinates
- System averages judge inputs
- Calculates winners by closest distance
- Full audit trail

## 🔐 Security

- Password-based competition access
- JWT authentication for admin panel
- bcrypt password hashing
- Role-based access control
- Input validation and sanitization

## 🎨 Design

All UI elements are built pixel-perfect from Figma mockups:
- Exact typography, colors, spacing
- Consistent component library
- Fully responsive (mobile, tablet, desktop)
- Touch-friendly interactions

## 📊 Database Schema

Core entities:
- **Competitions** - Competition details, images, limits
- **Participants** - User entries and tickets
- **Markers** - User-placed coordinates
- **Judges** - Judge marks and coordinates
- **Results** - Computed winners and rankings

## 🚢 Deployment

- **Frontend**: Vercel (automatic deployments)
- **Backend**: AWS EC2 / Render
- **Database**: AWS RDS (PostgreSQL)
- **Storage**: AWS S3

## 📝 License

Private and proprietary. All rights reserved.

## 👥 Contributors

Wishmasters Development Team

---

For detailed development guides, see the `/docs` folder (coming soon).
