# Phases 6, 7, 8 Implementation Summary

## ✅ Phase 6 — Evidence Handling (Security)

### 13. Evidence Access Rules

**✅ Implemented:**

1. **Signed URLs (Time-Limited)**
   - Location: `apps/admin/app/api/admin/flags/[id]/route.ts`
   - Uses `generateSignedEvidenceUrl()` from `cloudinaryEvidence.ts`
   - URLs expire after 1 hour (3600 seconds)
   - Signed URLs generated for both detail view and list view

2. **Do Not Expose Evidence URLs in Public App**
   - Location: `src/app/api/flags/route.ts`
   - Public API response no longer includes `evidenceUrl` or `evidencePublicId`
   - Evidence URLs are only accessible via admin APIs

3. **Only Fetch Evidence in Admin App**
   - New endpoint: `GET /api/admin/flags/:id/evidence`
   - Location: `apps/admin/app/api/admin/flags/[id]/evidence/route.ts`
   - Requires admin authentication via `requireAdmin()`
   - Returns signed URL with expiration time
   - Admin flag detail API (`GET /api/admin/flags/:id`) generates signed URLs automatically
   - Admin flag list API (`GET /api/admin/flags`) generates signed thumbnail URLs for table display

**Files Modified:**
- ✅ `src/app/api/flags/route.ts` - Removed evidence URLs from public response
- ✅ `apps/admin/app/api/admin/flags/[id]/route.ts` - Added signed URL generation
- ✅ `apps/admin/app/api/admin/flags/route.ts` - Added signed thumbnail URL generation
- ✅ `apps/admin/app/api/admin/flags/[id]/evidence/route.ts` - New endpoint for evidence access

---

## ✅ Phase 7 — Safety & Abuse Controls (MVP)

### 14. Guardrails

**✅ Implemented:**

1. **Rate-Limit Flag Creation Per User (3/day)**
   - Location: `src/app/api/flags/route.ts` (lines 116-130)
   - Checks flags created today (from midnight)
   - Returns `429 Too Many Requests` if limit exceeded
   - Error message: "You have reached the daily limit of 3 reports. Please try again tomorrow."

2. **Prevent Self-Reporting**
   - Location: `src/app/api/flags/route.ts` (lines 108-114)
   - Checks if `targetId === reporterId` for user flags
   - Returns `400 Bad Request` with error: "Cannot report yourself"

3. **Block Flagging Same Target Repeatedly in Short Time**
   - Location: `src/app/api/flags/route.ts` (lines 145-199)
   - Prevents duplicate flags within 24 hours
   - Checks both `user_flags` and `group_flags` tables
   - Returns `429 Too Many Requests` with details about existing flag

4. **Hide Reporter Identity from Admins (Optional)**
   - Location: `apps/admin/app/api/admin/flags/[id]/route.ts` (line 369)
   - Set `reporterInfo: null` to hide reporter information
   - Reporter ID still available in flag data for audit purposes
   - Can be re-enabled by removing the `null` assignment

**Files Modified:**
- ✅ `src/app/api/flags/route.ts` - Added rate limiting, self-report prevention, duplicate prevention

---

## ✅ Phase 8 — Notifications (Optional for MVP)

### 15. Admin Awareness

**✅ Implemented:**

1. **Dashboard Metric: "Pending Flags"**
   - Location: `apps/admin/app/page.tsx` (lines 218-233)
   - Displays pending flags count in dashboard card
   - Shows warning if flags older than 24 hours exist
   - Card highlights with yellow border when old flags present

2. **Highlight Flags > 24h Old**
   - Location: `apps/admin/components/AdminFlagsTable.tsx` (lines 226-283)
   - Flags older than 24 hours have yellow background
   - "⚠️ Old" badge displayed next to creation date
   - Visual highlighting in table rows
   - Metrics API includes `oldFlagsCount` for dashboard display

**Files Modified:**
- ✅ `apps/admin/app/api/admin/metrics/route.ts` - Added old flags count
- ✅ `apps/admin/app/page.tsx` - Enhanced pending flags card with old flags warning
- ✅ `apps/admin/components/AdminFlagsTable.tsx` - Added visual highlighting for old flags

---

## Implementation Details

### Phase 6: Evidence Security

**Signed URL Generation:**
```typescript
// Admin detail API
const signedUrl = generateSignedEvidenceUrl(publicId, {
  expiresIn: 3600, // 1 hour
});

// Admin list API (thumbnails)
const signedThumbnailUrl = generateSignedThumbnailUrl(publicId, {
  expiresIn: 3600,
  size: 150,
});
```

**New Evidence Endpoint:**
- `GET /api/admin/flags/:id/evidence`
- Returns: `{ evidenceUrl, signedUrl, expiresIn, expiresAt }`
- Admin-only access

### Phase 7: Abuse Prevention

**Rate Limiting Logic:**
```typescript
// Check flags created today
const todayStart = new Date();
todayStart.setHours(0, 0, 0, 0);
const { count: todayFlagCount } = await supabase
  .from("user_flags")
  .select("*", { count: "exact", head: true })
  .eq("reporter_id", reporterId)
  .gte("created_at", todayStart.toISOString());

if (todayFlagCount >= 3) {
  return 429; // Rate limit exceeded
}
```

**Duplicate Prevention:**
- Checks for existing flags within 24 hours
- Same reporter + same target = blocked
- Returns existing flag details in error response

### Phase 8: Admin Awareness

**Old Flags Detection:**
```typescript
const flagAge = Date.now() - new Date(flag.createdAt).getTime();
const isOldFlag = flagAge > 24 * 60 * 60 * 1000; // 24 hours
```

**Visual Indicators:**
- Yellow background for old flag rows
- "⚠️ Old" badge next to date
- Dashboard card highlights when old flags exist
- Shows count of old flags in dashboard

---

## Testing Checklist

### Phase 6:
- [ ] Verify evidence URLs not in public API response
- [ ] Test signed URL generation in admin APIs
- [ ] Verify signed URLs expire after 1 hour
- [ ] Test evidence endpoint requires admin auth

### Phase 7:
- [ ] Test rate limiting (try creating 4 flags in one day)
- [ ] Test self-report prevention (try reporting yourself)
- [ ] Test duplicate prevention (try reporting same user twice within 24h)
- [ ] Verify reporter info hidden in admin detail view

### Phase 8:
- [ ] Verify pending flags metric shows in dashboard
- [ ] Create a flag older than 24h and verify highlighting
- [ ] Check dashboard card highlights when old flags exist
- [ ] Verify "⚠️ Old" badge appears in table

---

## Security Notes

1. **Evidence URLs**: Never exposed in public APIs, only via admin endpoints with signed URLs
2. **Rate Limiting**: Prevents abuse and spam reporting
3. **Self-Reporting**: Prevents users from gaming the system
4. **Duplicate Prevention**: Reduces spam and duplicate reports
5. **Reporter Privacy**: Optional - currently hidden but can be re-enabled if needed for investigations

---

## All Phases Complete ✅

All three phases (6, 7, 8) have been successfully implemented and are ready for testing.
