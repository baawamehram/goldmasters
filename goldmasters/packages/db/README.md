# Wishmasters Spot-the-Ball - Database Package

Prisma-based database package for the Wishmasters Spot-the-Ball platform.

## 🗄️ Database Schema

### Core Models

- **Admin** - Admin users with authentication
- **Competition** - Competition details, configuration, and judging
- **Participant** - Users who enter competitions
- **Ticket** - Individual tickets with marker allowances
- **Marker** - User-placed markers with coordinates
- **JudgeMark** - Judge coordinates (manually entered by admin)
- **Result** - Calculated competition results
- **Winner** - Competition winners and prizes
- **AuditLog** - Full audit trail for transparency

### Key Features

✅ **Manual Judge Entry** - `finalJudgeX` and `finalJudgeY` fields store admin-entered coordinates after external judging

✅ **Distance Calculation** - Automatic winner computation based on closest distance to judge position

✅ **Complete Audit Trail** - Every action logged for transparency

✅ **Flexible Ticketing** - Pre-assign or self-purchase tickets

✅ **Competition Lifecycle** - DRAFT → ACTIVE → CLOSED → JUDGING → COMPLETED

## 🚀 Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Database

Create a `.env` file in the project root or set `DATABASE_URL`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/wishmasters_db?schema=public"
```

### 3. Generate Prisma Client

```bash
pnpm run generate
```

### 4. Push Schema to Database

For development (no migrations):
```bash
pnpm run push
```

For production (with migrations):
```bash
pnpm run migrate
```

### 5. Seed Database (Optional)

```bash
pnpm run seed
```

This creates:
- Admin user: `admin@wishmasters.com` / `admin123`
- Sample competition with 55 tickets
- Audit logs

## 📦 Scripts

```bash
# Generate Prisma Client
pnpm run generate

# Push schema without migrations (dev)
pnpm run push

# Create and apply migration (prod)
pnpm run migrate

# Deploy migrations (prod)
pnpm run migrate:deploy

# Reset database (WARNING: deletes all data)
pnpm run migrate:reset

# Open Prisma Studio (database GUI)
pnpm run studio

# Seed database with sample data
pnpm run seed
```

## 🔗 Using in Apps

### In Backend API (`apps/api`)

```typescript
import prisma from '@wishmasters/db';

// Get all active competitions
const competitions = await prisma.competition.findMany({
  where: { status: 'ACTIVE' },
  include: {
    createdBy: true,
    participants: true,
  },
});

// Create a participant
const participant = await prisma.participant.create({
  data: {
    competitionId: 'comp-id',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    status: 'REGISTERED',
  },
});

// Submit markers
const marker = await prisma.marker.create({
  data: {
    competitionId: 'comp-id',
    participantId: 'participant-id',
    ticketId: 'ticket-id',
    x: 150.5,
    y: 200.3,
  },
});

// Admin enters judge coordinates
const competition = await prisma.competition.update({
  where: { id: 'comp-id' },
  data: {
    finalJudgeX: 148.7,
    finalJudgeY: 201.1,
    isJudged: true,
    judgedAt: new Date(),
  },
});

// Calculate winners (custom function)
// Find markers with minimum distance to (finalJudgeX, finalJudgeY)
```

## 🎯 Database Workflow

### 1. Competition Creation
```
Admin creates competition → Status: DRAFT
Admin publishes → Status: ACTIVE
Tickets created automatically
```

### 2. Participant Entry
```
User accesses with password → Participant registered
User purchases tickets → Tickets assigned
User places markers → Markers saved with coordinates
Competition fills up → Status: CLOSED
```

### 3. Judging (External)
```
Judges mark position externally (live stream/video)
Admin enters final coordinates manually
  - finalJudgeX
  - finalJudgeY
  - isJudged = true
Status: JUDGING
```

### 4. Winner Calculation
```
System calculates distance for all markers
Sorts by closest distance
Creates Result entries (ranks)
Creates Winner entries (top positions)
Status: COMPLETED
```

### 5. Result Publishing
```
Admin publishes results
resultsPublished = true
publishedAt = timestamp
Participants can view results
```

## 🔐 Important Fields

### Competition
- `finalJudgeX` / `finalJudgeY` - Average judge coordinates (manually entered)
- `isJudged` - Whether judging is complete
- `resultsPublished` - Whether results are public

### Marker
- `x` / `y` - Participant's marker position
- `distanceToWinner` - Calculated distance to judge position

### JudgeMark
- Stores individual judge marks (1-4 judges)
- Used to compute average for `finalJudgeX/Y`

## 📊 Prisma Studio

View and edit data in a GUI:

```bash
pnpm run studio
```

Opens at: http://localhost:5555

## 🚢 Production Setup

1. Set production `DATABASE_URL`
2. Run migrations: `pnpm run migrate:deploy`
3. Ensure database backups are configured
4. Set up connection pooling (recommended)

## 📝 Schema Changes

When modifying the schema:

1. Edit `prisma/schema.prisma`
2. Run `pnpm run generate` (updates Prisma Client)
3. Run `pnpm run migrate` (creates migration)
4. Commit both schema and migration files

## 🔗 Related

- Backend API: `../../apps/api`
- Frontend: `../../apps/web`
