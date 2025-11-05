# Wishmasters Database Schema

## 📊 Entity Relationship Overview

```
┌─────────────┐
│    Admin    │
└──────┬──────┘
       │ creates
       ↓
┌─────────────┐      contains      ┌─────────────┐
│ Competition │◄────────────────────┤   Ticket    │
└──────┬──────┘                     └──────┬──────┘
       │                                   │
       │ has                               │ uses
       ↓                                   ↓
┌─────────────┐      places        ┌─────────────┐
│ Participant │───────────────────►│   Marker    │
└──────┬──────┘                     └─────────────┘
       │
       │ has results
       ↓
┌─────────────┐
│   Result    │
└──────┬──────┘
       │
       │ becomes
       ↓
┌─────────────┐
│   Winner    │
└─────────────┘

       Competition
           │
           │ records
           ↓
    ┌─────────────┐
    │  JudgeMark  │ (Judge 1-4 marks)
    └─────────────┘
           │
           │ averaged to
           ↓
    finalJudgeX, finalJudgeY
```

## 🔑 Key Relationships

### Competition Flow
1. **Admin** creates **Competition**
2. **Competition** generates **Tickets** (1-to-many)
3. **Participant** purchases **Tickets** (many-to-many)
4. **Participant** places **Markers** on **Tickets** (many-to-many)

### Judging Flow
1. Judges mark externally (live/video)
2. Admin enters **JudgeMark** (4 judges)
3. System averages to `finalJudgeX`, `finalJudgeY` on **Competition**
4. System calculates **Marker** distances
5. System generates **Results** (ranked)
6. Top results become **Winners**

## 📋 Model Details

### Competition
- Core entity for competitions
- Stores final judge coordinates (`finalJudgeX`, `finalJudgeY`)
- Lifecycle: DRAFT → ACTIVE → CLOSED → JUDGING → COMPLETED

### Participant
- Users who enter competitions
- Can have multiple tickets
- Each ticket allows multiple markers

### Ticket
- Individual ticket with marker allowance
- Can be pre-assigned or purchased
- Tracks marker usage

### Marker
- User-placed marker with X, Y coordinates
- `distanceToWinner` calculated after judging
- Used for ranking

### JudgeMark
- Stores individual judge marks (1-4 judges)
- Used to compute average for `finalJudgeX/Y`
- Can reference video/image proof (S3)

### Result
- Computed ranking for each participant
- Links best marker to participant
- Ordered by closest distance

### Winner
- Top-ranked results with prizes
- Notification tracking
- Prize value and description

### AuditLog
- Complete audit trail
- Tracks all entity changes
- Essential for transparency

## 🎯 Critical Fields

| Model | Field | Purpose |
|-------|-------|---------|
| Competition | `finalJudgeX`, `finalJudgeY` | Manually entered average judge position |
| Competition | `isJudged` | Whether external judging is complete |
| Marker | `distanceToWinner` | Calculated distance to judge position |
| JudgeMark | `judgeNumber` | Which judge (1-4) |
| Result | `rank` | Overall ranking (1 = winner) |
| AuditLog | `oldValue`, `newValue` | Change tracking (JSON) |
