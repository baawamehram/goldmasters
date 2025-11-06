# Root Cause Analysis (RCA)
## 400 Bad Request on Participant Authentication - November 6, 2025

---

### **Incident Summary**
**Date/Time:** November 6, 2025 (Ongoing)
**Duration:** Unknown (Investigation conducted at 14:20 UTC)
**Impact:** Users cannot authenticate on competition entry page
**Severity:** **High** (Core user journey broken - participants cannot place markers)
**Status:** ⚠️ **ACTIVE ISSUE** (Not Fixed - Analysis Only)

---

## **Symptom**

### **User Experience**
- User navigates to: `https://goldmasters.world/competition/user-1762437881185-iy5u1q2nx/enter`
- Page loads successfully, but user cannot proceed with marker placement
- Network tab shows:
  ```
  POST /api/v1/competitions/user-1762437881185-iy5u1q2nx/participants/authenticate
  Status: 400 Bad Request
  ```

### **API Response**
```json
{
  "status": "fail",
  "errors": [
    {
      "type": "field",
      "path": "name",
      "msg": "Name is required",
      "location": "body"
    },
    {
      "type": "field",
      "path": "phone",
      "msg": "Phone number is required",
      "location": "body"
    }
  ]
}
```

---

## **Root Cause**

### **Primary Issue: Auto-Authentication Data Missing**

The authentication is failing because **the request body is missing required fields** (`name` and `phone`). This occurs during the **auto-authentication flow** triggered on page load.

### **Technical Flow Analysis**

#### **1. Entry Page Auto-Authentication (Lines 187-258)**
When the user accesses `/competition/[id]/enter`, the page attempts to auto-authenticate:

```typescript
// Line 200: Retrieves stored user data
const competitionUser = localStorage.getItem('competition_user');

if (competitionUser) {
  const user = JSON.parse(competitionUser);

  // Line 209-218: Auto-authenticate with stored credentials
  const response = await fetch(
    buildApiUrl(`competitions/${id}/participants/authenticate`),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: user.name,    // ❌ user.name is undefined
        phone: user.phone,  // ❌ user.phone is undefined
      }),
    }
  );
}
```

#### **2. API Route Validation (Lines 26-36)**
The API endpoint expects both fields to be present and non-empty:

```typescript
// Line 22: Destructure name and phone from request body
const { name, phone } = body as { name?: string; phone?: string };

// Lines 26-32: Validate required fields
if (!name || typeof name !== 'string' || !name.trim()) {
  errors.push(fieldError('name', 'Name is required', name));
}

if (!phone || typeof phone !== 'string' || !phone.trim()) {
  errors.push(fieldError('phone', 'Phone number is required', phone));
}

// Line 34-36: Return 400 if validation fails
if (errors.length) {
  return validationFailure(errors, 400);
}
```

### **Root Cause Categories**

1. **Missing Data in localStorage**
   - `localStorage.getItem('competition_user')` exists but doesn't contain valid `name` and `phone` fields
   - Possible reasons:
     - User data was never properly stored
     - Data was stored with different property names
     - Data was corrupted or partially cleared
     - User bypassed the gate page where this data should be set

2. **Broken User Journey**
   - User accessed `/enter` page directly (via URL or refresh)
   - Gate page (`/competition/[id]/gate`) should set `competition_user` before allowing access
   - Access check only validates presence of tokens, not data completeness:
     ```typescript
     // Line 134-142: Access check
     const token = localStorage.getItem('competition_access_token');
     const hasCompetitionAccess = localStorage.getItem(`competition_${id}_access`);

     if (!token || !hasCompetitionAccess) {
       router.push(`/competition/${id}/gate`);
       return;
     }
     ```
   - **Missing validation:** Code doesn't verify that `competition_user` has valid data

---

## **Impact Assessment**

### **User Impact**
- ✅ **Affected Users:** All users attempting to enter competition `user-1762437881185-iy5u1q2nx`
- ✅ **Likely Scope:** Users who:
  - Refresh the page after initial gate authentication
  - Have corrupted localStorage data
  - Accessed the enter page via direct URL/bookmark
- ✅ **Functionality Lost:** Cannot authenticate as participant → Cannot place markers → Cannot complete competition entry
- ✅ **Data Loss:** None (no markers placed yet)

### **Business Impact**
- **Critical User Journey Broken:** Participants cannot complete entries
- **Revenue Impact:** Cannot collect ticket entries/submissions
- **User Experience:** Confusing - page loads but appears broken (no error message shown to user)
- **Scope:** Potentially affects all competitions if localStorage pattern is inconsistent

---

## **Data Flow Diagram**

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User Journey                                 │
└─────────────────────────────────────────────────────────────────────┘

1. User enters competition password
   └─> /competition/[id]/gate
       └─> Stores: competition_access_token
       └─> Stores: competition_[id]_access
       └─> Stores: competition_user ← ❌ PROBLEM HERE
           Expected: { name: "...", phone: "..." }
           Actual: { } or missing fields

2. User redirected to entry page
   └─> /competition/[id]/enter
       └─> Reads: competition_user
       └─> Attempts auto-authentication:
           POST /api/v1/competitions/[id]/participants/authenticate
           Body: { name: undefined, phone: undefined }
           ← ❌ 400 Bad Request

3. User stuck - cannot proceed
   └─> No error message displayed
   └─> Page appears to load but markers cannot be placed
```

---

## **Additional Investigation Needed**

### **Questions to Answer:**

1. **Gate Page Data Storage**
   - What does the gate page (`/competition/[id]/gate/page.tsx`) store in `competition_user`?
   - Does it capture name and phone from password submission?
   - Is there a separate form for name/phone entry?

2. **Alternative Entry Method**
   - Is there a manual authentication form on the enter page?
   - Line 439-489 shows `handleParticipantAuth` function - is this UI hidden/broken?
   - Should users see a form to enter name/phone if auto-auth fails?

3. **Data Consistency**
   - Check database: Does participant exist for this competition?
   - Verify participant record has matching name/phone
   - Check if admin assigned tickets properly

4. **Browser State**
   - Examine localStorage contents for affected user
   - Check if `competition_user` exists and its structure
   - Verify all required tokens are present

---

## **Possible Solutions** (Investigation Required)

### **Option 1: Fix Gate Page Data Collection**
**If gate page isn't storing user data:**
- Add form fields for name/phone on gate page
- Store complete user object in `competition_user`:
  ```typescript
  localStorage.setItem('competition_user', JSON.stringify({
    name: formData.name,
    phone: formData.phone
  }));
  ```

### **Option 2: Show Authentication Form on Enter Page**
**If auto-auth fails, show manual form:**
- Lines 439-489 already have `handleParticipantAuth` function
- UI might be conditionally hidden
- Show form when:
  ```typescript
  (!participant && !isParticipantLoading)
  ```

### **Option 3: Improve Access Control**
**Validate data completeness before allowing entry:**
```typescript
// In enter page access check (line 134)
const competitionUser = localStorage.getItem('competition_user');
const userData = competitionUser ? JSON.parse(competitionUser) : null;

if (!userData?.name || !userData?.phone) {
  // Redirect back to gate to re-enter credentials
  router.push(`/competition/${id}/gate`);
  return;
}
```

### **Option 4: Better Error Handling**
**Show user-friendly error when auth fails:**
```typescript
// Line 236: Instead of silent console.error
if (!response.ok) {
  setParticipantError(
    "We couldn't verify your details automatically. Please enter them below."
  );
  // Show manual authentication form
}
```

---

## **Recommended Investigation Steps**

1. **Check Gate Page Implementation:**
   ```bash
   # View gate page code
   cat apps/web/src/app/competition/[id]/gate/page.tsx

   # Look for:
   # - localStorage.setItem('competition_user', ...)
   # - What data is stored during password verification
   ```

2. **Inspect Database State:**
   ```sql
   -- Check if participant exists
   SELECT id, name, phone, competitionId
   FROM "Participant"
   WHERE phone = '[USER_PHONE]'
   AND competitionId = '[ACTUAL_COMPETITION_ID]';

   -- Check UserEntry (admin assignments)
   SELECT id, phone, assignedTickets
   FROM "UserEntry"
   WHERE phone = '[USER_PHONE]';
   ```

3. **Check localStorage in Browser DevTools:**
   ```javascript
   // Console commands
   localStorage.getItem('competition_user')
   localStorage.getItem('competition_access_token')
   localStorage.getItem('competition_user-1762437881185-iy5u1q2nx_access')
   ```

4. **Test Complete User Journey:**
   - Start fresh (clear localStorage)
   - Navigate to `/competition/user-1762437881185-iy5u1q2nx/gate`
   - Enter password
   - Check what data is stored
   - Proceed to `/enter` page
   - Monitor network requests

---

## **Files Requiring Review**

| File | Purpose | Lines of Interest |
|------|---------|-------------------|
| `apps/web/src/app/competition/[id]/gate/page.tsx` | Password entry & user registration | Check data storage logic |
| `apps/web/src/app/competition/[id]/enter/page.tsx` | Entry page with auto-auth | Lines 200-247 (auto-auth), 439-489 (manual auth form) |
| `apps/web/src/app/api/v1/competitions/[id]/participants/authenticate/route.ts` | Authentication API | Lines 22-36 (validation) |

---

## **Prevention Recommendations**

### **Short-term:**
1. ✅ Add error boundary for auto-authentication failures
2. ✅ Show manual authentication form as fallback
3. ✅ Validate localStorage data before using it
4. ✅ Display user-friendly error messages

### **Long-term:**
1. ⚠️ Implement proper session management (not localStorage-based)
2. ⚠️ Add data validation layer before redirects
3. ⚠️ Implement health checks for user journey completeness
4. ⚠️ Add logging/monitoring for authentication failures
5. ⚠️ Consider using secure cookies or JWT tokens instead of localStorage

---

## **Severity Analysis**

### **Why This Is High Severity:**

1. **Blocks Core User Journey**
   - Users cannot place markers (primary app function)
   - No workaround available to end users

2. **Silent Failure**
   - No error message shown to user
   - Page appears to work but is broken
   - Users likely to give up without reporting

3. **Potentially Widespread**
   - Affects all users who refresh or bookmark the enter page
   - May affect multiple competitions if pattern is consistent

4. **Business Impact**
   - Direct revenue loss (no entries = no ticket sales)
   - User trust erosion (broken experience)

### **Why Not Critical:**

- Doesn't affect existing entries (data safe)
- Doesn't crash the entire site
- Admin panel likely unaffected
- Can be worked around if gate page is accessible

---

## **Next Steps**

### **Immediate Actions Required:**

1. **Investigate Gate Page** (1 hour)
   - Review gate page code
   - Identify what data is stored in `competition_user`
   - Determine if name/phone collection is missing

2. **Reproduce Issue** (30 minutes)
   - Clear localStorage
   - Walk through complete user journey
   - Document exact steps that cause failure

3. **Implement Quick Fix** (2 hours)
   - Option A: Show manual auth form when auto-auth fails
   - Option B: Redirect to gate if data is incomplete
   - Add user-visible error messages

4. **Deploy and Verify** (30 minutes)
   - Test fix in production
   - Verify user can complete entry

### **Follow-up Actions:**

5. **Add Monitoring** (1 day)
   - Track authentication failure rates
   - Alert on 400 responses from auth endpoint

6. **Improve Data Flow** (3 days)
   - Refactor localStorage usage
   - Implement proper session management
   - Add validation at each step

7. **Update Documentation** (1 day)
   - Document complete user journey
   - Create troubleshooting guide
   - Add error handling best practices

---

## **Sign-off**

**Prepared by:** Development Team
**Date:** November 6, 2025
**Analysis Type:** Root Cause Analysis (Investigation - No Fix Applied)
**Status:** ⚠️ **Active Issue - Requires Immediate Fix**

**Next Owner:** Development Team (Frontend)

---

## **Appendix A: API Contract**

### **Expected Request:**
```http
POST /api/v1/competitions/{id}/participants/authenticate
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "+1234567890"
}
```

### **Actual Request (Failing):**
```http
POST /api/v1/competitions/user-1762437881185-iy5u1q2nx/participants/authenticate
Content-Type: application/json

{
  "name": undefined,
  "phone": undefined
}
```

### **Error Response:**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "status": "fail",
  "errors": [
    {
      "type": "field",
      "path": "name",
      "msg": "Name is required",
      "location": "body"
    },
    {
      "type": "field",
      "path": "phone",
      "msg": "Phone number is required",
      "location": "body"
    }
  ]
}
```

---

## **Appendix B: Code References**

### **Auto-Authentication Logic (Enter Page)**
**File:** `apps/web/src/app/competition/[id]/enter/page.tsx`
**Lines:** 200-247

```typescript
const competitionUser = localStorage.getItem('competition_user');

if (competitionUser) {
  const user = JSON.parse(competitionUser);

  const response = await fetch(
    buildApiUrl(`competitions/${id}/participants/authenticate`),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: user.name,    // ← undefined
        phone: user.phone,  // ← undefined
      }),
    }
  );

  // Error handling just logs to console (line 236)
  console.error('[Enter Page] Auto-authentication failed:', data.message);
}
```

### **API Validation Logic**
**File:** `apps/web/src/app/api/v1/competitions/[id]/participants/authenticate/route.ts`
**Lines:** 22-36

```typescript
const { name, phone } = body as { name?: string; phone?: string };

if (!name || typeof name !== 'string' || !name.trim()) {
  errors.push(fieldError('name', 'Name is required', name));
}

if (!phone || typeof phone !== 'string' || !phone.trim()) {
  errors.push(fieldError('phone', 'Phone number is required', phone));
}

if (errors.length) {
  return validationFailure(errors, 400);  // ← Returns 400 Bad Request
}
```
