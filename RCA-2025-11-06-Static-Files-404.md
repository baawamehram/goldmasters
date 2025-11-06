# Root Cause Analysis (RCA)
## Production Site 404 Errors - November 6, 2025

---

### **Incident Summary**
**Date/Time:** November 6, 2025, 14:00 - 14:20 UTC
**Duration:** ~20 minutes
**Impact:** Production site (goldmasters.world) was inaccessible - static JavaScript chunks returning 404 errors
**Severity:** **Critical** (Complete site outage)
**Status:** ✅ **RESOLVED**

---

## **Timeline**

| Time (UTC) | Event |
|------------|-------|
| 14:00 | Issue reported - site showing 404 errors for `_next/static/chunks/*.js` files |
| 14:05 | Investigation began - verified nginx configuration was correct |
| 14:08 | Root cause identified - standalone build missing static files |
| 14:16 | Fix applied - copied static files to standalone directory |
| 14:17 | PM2 restart completed - site verified working |
| 14:20 | Permanent fix implemented - post-build script created |

---

## **Root Cause**

### **Primary Cause**
Next.js was configured to use **standalone output mode** (`output: 'standalone'` in `next.config.mjs`), which creates an optimized production build. However, **standalone mode does not automatically include static assets** (`_next/static/` and `public/` directories) in the output.

### **Technical Details**
1. **Build Configuration:**
   - `next.config.mjs` had `output: 'standalone'` enabled for CI/production builds
   - Build process created `.next/standalone/` directory with server code
   - Static assets remained in `.next/static/` (outside standalone directory)

2. **Runtime Configuration:**
   - PM2 ecosystem config ran the app from `.next/standalone/apps/web/server.js`
   - Next.js server looked for static files in `.next/standalone/apps/web/.next/static/`
   - Static files were not present in this location → 404 errors

3. **Missing Process:**
   - No post-build step to copy static files to standalone directory
   - This is a **required manual step** per Next.js documentation for standalone builds

---

## **Impact Assessment**

### **User Impact**
- ✅ **Users Affected:** All visitors to goldmasters.world
- ✅ **Functionality Lost:** Complete site unavailability (blank page/loading errors)
- ✅ **Data Loss:** None
- ✅ **Duration:** ~20 minutes

### **Business Impact**
- Site completely inaccessible during the incident window
- Potential loss of competition entries/ticket sales during downtime
- User experience degradation and trust impact

---

## **Resolution**

### **Immediate Fix (Applied 14:16 UTC)**
```bash
# Manually copied static files to standalone directory
cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/static
cp -r apps/web/public apps/web/.next/standalone/apps/web/public

# Restarted the application
pm2 restart goldmasters-web
```

### **Permanent Fix (Applied 14:20 UTC)**
1. **Created post-build script** (`apps/web/scripts/post-build.sh`):
   - Automatically copies `.next/static` to standalone directory
   - Automatically copies `public` assets to standalone directory
   - Runs after every production build

2. **Updated package.json**:
   ```json
   "build": "next build && bash scripts/post-build.sh"
   ```

3. **Added documentation**:
   - Created `netlify.toml` (for reference, though self-hosted)
   - Commented out standalone mode (can be re-enabled with proper post-build)

---

## **Preventive Measures**

### **Short-term (Implemented)**
- ✅ Post-build script now automatically handles static file copying
- ✅ Build process validates static files are in correct location
- ✅ Updated deployment documentation

### **Long-term (Recommended)**
1. **Monitoring & Alerting:**
   - [ ] Implement uptime monitoring (e.g., UptimeRobot, Pingdom)
   - [ ] Add health check endpoint (`/api/health`)
   - [ ] Configure alerts for 404 spikes in nginx logs

2. **Deployment Process:**
   - [ ] Create deployment checklist/runbook
   - [ ] Add smoke tests post-deployment (verify key assets load)
   - [ ] Consider blue-green deployment for zero-downtime deploys

3. **Infrastructure:**
   - [ ] Add staging environment to test builds before production
   - [ ] Implement automated deployment pipeline with validation steps
   - [ ] Document manual deployment procedures

4. **Observability:**
   - [ ] Add error tracking (e.g., Sentry) to catch client-side errors
   - [ ] Set up structured logging for easier debugging
   - [ ] Create dashboard for key metrics (response times, error rates)

---

## **Lessons Learned**

### **What Went Well**
- ✅ Quick diagnosis (5 minutes to identify root cause)
- ✅ nginx configuration was already correct - no config changes needed
- ✅ Fast resolution (16 minutes from report to fix)
- ✅ Permanent fix implemented immediately to prevent recurrence

### **What Could Be Improved**
- ⚠️ Lack of pre-deployment validation (missing static files not caught)
- ⚠️ No uptime monitoring to detect issue proactively
- ⚠️ Build process didn't validate completeness of standalone build
- ⚠️ Missing staging environment to catch issues before production

### **Action Items**
| Action | Owner | Priority | Deadline |
|--------|-------|----------|----------|
| Implement uptime monitoring | DevOps | High | Nov 8, 2025 |
| Add health check API endpoint | Backend | High | Nov 8, 2025 |
| Create deployment runbook | DevOps | Medium | Nov 10, 2025 |
| Set up staging environment | DevOps | Medium | Nov 15, 2025 |
| Add error tracking (Sentry) | Frontend | Low | Nov 20, 2025 |

---

## **Technical References**

- **Next.js Standalone Documentation:** https://nextjs.org/docs/app/api-reference/next-config-js/output#automatically-copying-traced-files
- **Issue Pattern:** Common misconfiguration when using standalone builds
- **Files Modified:**
  - `apps/web/next.config.mjs` (commented standalone mode)
  - `apps/web/scripts/post-build.sh` (created)
  - `apps/web/package.json` (updated build script)
  - `apps/web/netlify.toml` (created for reference)

---

## **Sign-off**

**Prepared by:** Claude Code Assistant
**Date:** November 6, 2025
**Status:** Incident Closed - Resolution Verified

**Approval:**
- [ ] Engineering Lead
- [ ] DevOps Lead
- [ ] Product Manager

---

### **Appendix: Verification**

```bash
# Verify fix is working
curl -I https://goldmasters.world/_next/static/chunks/b85bc11b25807f45.js
# Expected: HTTP/2 200 OK

# Verify on next deployment
pnpm build  # Should automatically run post-build.sh
ls -la apps/web/.next/standalone/apps/web/.next/static/  # Should contain chunks/
```
