# User ID Consistency Fix - Checkout to Admin Dashboard

## Problem
When users completed checkout at `/competition/:userId/checkout`, the checkout data wasn't appearing in the admin dashboard at `/admin/entries/:userId/view`. 

The system was using `userId` in URLs but not properly linking checkout data to these user IDs.

## Root Cause
The application uses a non-standard URL structure where `userId` appears in place of `competitionId`:
- User navigates to: `/competition/user-1761637008241-wo741fqnr/checkout`
- Admin views at: `/admin/entries/user-1761637008241-wo741fqnr/view`

The checkout API endpoint `POST /api/v1/competitions/:id/checkout` was treating the `:id` parameter as a `competitionId`, but the frontend was passing a `userId`.

## Solution Implemented

### 1. API Data Model Changes (`apps/api/src/data/mockDb.ts`)
- Added `userId` field to `CheckoutSummary` type
- Added `UserEntry` type for tracking user records
- Created `createOrUpdateUserEntry()` function to manage user entries
- Updated `saveCheckoutSummary()` to save by both `participantId` AND `userId`
- Added `getCheckoutSummaryByUserId()` for userId-based lookups

### 2. API Checkout Endpoint Updates (`apps/api/src/routes/competition.routes.ts`)
- Added logic to detect if `:id` parameter is a `userId` (starts with 'user-')
- When `userId` is detected:
  - Use default competition ID ('test-id')
  - Preserve the `userId` for linking
  - Create or find user entry with that `userId`
- Link checkout summary to both `participantId` and `userId`
- Updated GET endpoint to try both `participantId` and `userId` lookups

### 3. Code Changes

**Key changes in checkout endpoint:**
```typescript
// Detect if the id parameter is a userId or competitionId
const isUserId = id.startsWith('user-');
const actualCompetitionId = isUserId ? 'test-id' : id;
const requestedUserId = isUserId ? id : null;

// Create or update user entry
const userEntry = createOrUpdateUserEntry(
  name.trim(), 
  sanitizedPhone, 
  requestedUserId || undefined
);
const userId = userEntry.id;

// Save checkout summary with both IDs
const checkoutSummary: CheckoutSummary = {
  competitionId: actualCompetitionId,
  participantId: participantRecord.id,
  userId: userId, // Now included
  // ... rest of summary
};

saveCheckoutSummary(actualCompetitionId, participantRecord.id, checkoutSummary);
```

**Updated GET endpoint:**
```typescript
router.get('/:id/checkout-summary/:participantId', ..., async (req, res) => {
  const { id, participantId } = req.params;
  
  // Try participantId first
  let summary = getCheckoutSummary(id, participantId);
  
  // Fallback to userId lookup
  if (!summary) {
    summary = getCheckoutSummaryByUserId(id, participantId);
  }
  
  // Return summary or 404
});
```

## Testing

Run the test script to verify:
```powershell
powershell -File scripts\test-userId-checkout.ps1
```

Or manually test:
1. Navigate to `http://localhost:3000/competition/user-1761637008241-wo741fqnr/checkout`
2. Complete checkout with any user details
3. Login to admin dashboard
4. Go to `http://localhost:3000/admin/entries/user-1761637008241-wo741fqnr/view`
5. Verify checkout data appears with all tickets and markers

## Result

✅ Checkout data now persists correctly with userId
✅ Admin dashboard can retrieve checkout data using userId
✅ User ID remains consistent throughout the flow
✅ No changes required to frontend components
✅ Backward compatible with existing participantId lookups

## Files Modified

1. `apps/api/src/data/mockDb.ts` - Added userId support and user entry management
2. `apps/api/src/routes/competition.routes.ts` - Updated checkout endpoint logic
3. `scripts/test-userId-checkout.ps1` - Created test script for verification

## Notes

- The system uses userId in URLs where competitionId would typically be expected
- All users currently use the default competition ('test-id')
- The fix maintains backward compatibility with participantId-based lookups
- Both API and web servers must be restarted for changes to take effect
