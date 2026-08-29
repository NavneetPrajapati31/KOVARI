# BUG-G2b Backend Fix Validation Guide

> **Status:** DELIVERY FIX IMPLEMENTED (dual-room + FCM alignment) — **HUMAN QA REQUIRED** — do not mark VERIFIED PASS until Test G re-run on deployed backend + correct APK

---

## 1. Original BUG-G2b Symptom

Production QA Test G (2026-08-29):

1. Account B submits a join request to Account A's group.
2. Database records `pending_request` correctly.
3. Account A receives **no push notification**.
4. Account A's mobile **Join Requests sheet does not update dynamically**.

Tests A–F (mutation-side BUG-G2 fix) remain **PASS**. Test G fails on **receiver-side** delivery.

Forensic report: [`bug-g2b-forensic-report.md`](file:///c:/Users/navne/CSE/DEV/KOVARI/docs/production-qa/phase-1/bug-g2b-forensic-report.md)

---

## 2. Root Causes Addressed (Backend Scope)

| ID | Root Cause | Backend Fix |
| :--- | :--- | :--- |
| **RC-1** | `POST /groups/:groupId/join-request` never called `createNotification()` | Added `notifyGroupJoinRequestRecipients()` on both successful insert paths |
| **RC-2** | `createNotification()` pipeline had no socket `new_notification` emit for non-chat types | Centralized Redis pub/sub → Socket.IO emit in `createNotification()` via `emitRealtimeNotification()` |
| **RC-3** | `shouldSendPush()` suppressed FCM for online users assuming socket already delivered — but socket never fired | Suppression now keyed to `REALTIME_SOCKET_DELIVERED_TYPES` after RC-2 socket delivery exists |
| **RC-4** | Socket emit targeted `user_socket:{clerkId}` only; mobile joins `user_socket:{supabaseUuid}` | Dual-room fan-out via `notificationSocketRoomIds()`; FCM suppresses on UUID room occupancy only; creator eligible for join-request FCM |

Forensic report: [`bug-g2b-production-forensic-investigation.md`](file:///c:/Users/navne/CSE/DEV/KOVARI/docs/production-qa/phase-1/bug-g2b-production-forensic-investigation.md)

---

## 3. Files Changed

| File | Change |
| :--- | :--- |
| `apps/web/src/app/api/groups/[groupId]/join-request/route.ts` | RC-1: notify admins/creator after pending_request insert (new + declined→pending paths) |
| `apps/web/src/lib/notifications/notifyGroupJoinRequestRecipients.ts` | **New** — server-side recipient resolution + `createNotification()` calls |
| `apps/web/src/lib/notifications/createNotification.ts` | RC-2: call `emitRealtimeNotification()` in `after()` hook |
| `apps/web/src/services/notifications/emitRealtimeNotification.ts` | **New** — Redis publish to `notifications:new_notification` channel |
| `apps/web/src/services/notifications/realtimeNotificationTypes.ts` | Shared types + `notificationSocketRoomIds()` dual-room helper |
| `apps/web/src/services/notifications/shouldSendPush.ts` | RC-3/RC-4: UUID-room FCM suppression; creator eligibility for join requests |
| `apps/web/src/services/notifications/pushService.ts` | Passes `clerkId` + `supabaseId` into `shouldSendPush()` |
| `apps/web/src/services/socket/server.ts` | RC-2/RC-4: subscribe to channel; fan-out to all `notificationSocketRoomIds()` |
| `packages/api/src/notifications/constants.ts` | **New** — `NOTIFICATION_SOCKET_CHANNEL` constant |
| `packages/types/src/socket.ts` | Extended `new_notification` payload type (additive; chat fields preserved) |

**Not changed:** Flutter/mobile code, `group_details_provider.dart`, web UI, database schema.

---

## 4. Implementation Approach

### RC-1 — Join-request notification creation

After successful `pending_request` write (insert or declined→pending update), the route calls `notifyGroupJoinRequestRecipients(groupId, requesterUserId)` which:

1. Resolves recipients server-side: group **creator** + **accepted admins** (excluding requester).
2. Creates one `GROUP_JOIN_REQUEST_RECEIVED` notification per recipient via existing `createNotification()`.
3. Does **not** notify on duplicate/already-pending error paths (400 responses unchanged).

### RC-2 — Centralized realtime socket delivery

```
createNotification()
    ├── DB insert (notifications table)
    └── after()
          ├── NotificationEventDispatcher (email — unchanged)
          ├── emitRealtimeNotification() → Redis publish
          │         └── Socket server → io.to(`user_socket:{clerkId}`) **and** io.to(`user_socket:{supabaseUuid}`).emit("new_notification", ...)
          └── evaluatePushNotifications() → FCM (existing policy)
```

Mirrors the existing `BAN_SOCKET_CHANNEL` cross-process pattern (Next.js API ↔ Socket.IO server).

### RC-3 — FCM policy correction

For types in `REALTIME_SOCKET_DELIVERED_TYPES` (join requests, match interest, group invites, etc.):

- **Mobile UUID room occupied:** FCM suppressed; socket delivery covers mobile realtime.
- **Web Clerk room occupied but mobile UUID room empty:** FCM **still sent** (mobile device may be offline/backgrounded).
- **Offline (both rooms empty):** FCM proceeds per existing priority/admin/creator rules.
- **Clerk-less recipients:** Redis emit uses Supabase UUID room; FCM no longer black-holed by wrong presence key.

`NEW_MESSAGE` chat room-aware suppression is **unchanged**.

### RC-4 — Dual-room delivery (2026-08-29 forensic follow-up)

Production QA after `e9ad6bf8` + `d8029436` still failed Scenarios 1–4. Forensic investigation proved mobile sockets join `user_socket:{JWT sub}` (Supabase UUID) while emits targeted Clerk id only.

**Fix:** `notificationSocketRoomIds(clerkUserId, userId)` drives both Redis payload fields and socket subscriber fan-out. `createNotification()` always passes both ids when available. `shouldSendPush()` suppresses FCM when the **UUID** socket room is occupied (not merely the Clerk room). Group **creators** are FCM-eligible even without admin/owner membership role.

**Deployment:** Vercel / Render / APK runtime SHA **UNKNOWN** until confirmed post-deploy. Git commit alone ≠ production fix.

---

## 5. Automated Tests

| Test File | Coverage |
| :--- | :--- |
| `notifyGroupJoinRequestRecipients.test.ts` | Recipient resolution, one notification per admin, no self-notify |
| `emitRealtimeNotification.test.ts` | Dual-id Redis payload, UUID-only clerk-less path, chat backward-compat |
| `shouldSendPush.test.ts` | UUID-room suppress; clerk-room-only does not suppress; creator eligibility; chat regression |
| `realtimeNotificationTypes.test.ts` | `notificationSocketRoomIds()` dedupe and clerk-less cases |

**Command:**

```bash
cd apps/web
npx vitest run src/services/notifications/ src/lib/notifications/notifyGroupJoinRequestRecipients.test.ts
```

**Result:** 17/17 notification tests PASS (2026-08-29 RC-4). Mobile bridge: 13/13 PASS (unchanged).

---

## 6. Web Regression Safety

- **Chat notifications:** `NEW_MESSAGE` room-aware FCM logic preserved; chat socket emit in `events.ts` unchanged.
- **Existing notification producers:** All routes calling `createNotification()` now also get realtime socket delivery (additive).
- **API responses:** Join-request POST response format unchanged; notification failures are logged, non-blocking.
- **Database:** No migration required; uses existing `notifications` table.
- **Payload contract:** `new_notification` chat payloads unchanged; non-chat types gain optional `entity_type` / `entity_id` / `id` fields.

---

## 7. Remaining Work

1. **Deploy** backend RC-4 fix to Vercel + Render; confirm deployment SHA.
2. **Rebuild APK** from branch containing `d8029436`+ mobile bridge; record versionCode on Test G protocol.
3. **Human QA:** Re-run Test G Scenarios 1–6 per [`bug-g2b-mobile-fix-validation.md`](file:///c:/Users/navne/CSE/DEV/KOVARI/docs/production-qa/phase-1/bug-g2b-mobile-fix-validation.md).

Until post-deploy human QA:

- **BUG-G2b status:** FIX IMPLEMENTED — **HUMAN QA REQUIRED** (not VERIFIED PASS).
- **BUG-R4 / BUG-N1a:** Remain open independently; RC-4 may partially help once deployed.

---

## 8. Manual QA Protocol (Post-Backend + Mobile Bridge)

### Test G — Inbound Join Request (requires new APK)

1. Deploy backend fix to production/staging.
2. Install APK with mobile realtime bridge (future task).
3. Account A (admin) logged into mobile with group accessible.
4. Account B submits join request.
5. **Expected:** Push notification on A; Join Requests sheet updates dynamically.

### Regression — Tests A–F (BUG-G2 mutation sync)

Re-run [`bug-g2-fix-validation.md`](file:///c:/Users/navne/CSE/DEV/KOVARI/docs/production-qa/phase-1/bug-g2-fix-validation.md) Tests A–F. Must remain PASS.

### Backend-only smoke (without mobile bridge)

1. Account B submits join request via web or mobile.
2. Verify `notifications` table row: `type = GROUP_JOIN_REQUEST_RECEIVED`, correct `user_id` (admin/creator).
3. With Account A online on web: verify `new_notification` socket event in browser devtools / notification list updates.
4. With Account A offline: verify FCM push delivery attempt (`push_status` on notification row).

---

## 9. Pass Criteria

### Backend (this task)

- [x] Join request POST creates `GROUP_JOIN_REQUEST_RECEIVED` notification(s).
- [x] `createNotification()` emits realtime socket event for non-chat types.
- [x] Online FCM suppression aligned with socket delivery.
- [x] Automated tests pass.
- [x] No database migration.
- [x] No mobile/Flutter changes.

### End-to-end BUG-G2b (pending human QA)

- [x] Backend pipeline RC-1–RC-3 (`e9ad6bf8`)
- [x] Mobile bridge (`d8029436`)
- [x] Delivery-path RC-4 dual-room + FCM alignment (uncommitted → pending commit)
- [x] Automated tests: 17/17 web + 13/13 mobile PASS
- [x] Human production QA (2026-08-29, pre-RC-4) — **FAIL** Scenarios 1–4; **PASS** Scenarios 5–6
- [ ] Post-RC-4 deploy + APK rebuild confirmed
- [ ] Test G full PASS sign-off

See [`bug-g2b-mobile-fix-validation.md`](file:///c:/Users/navne/CSE/DEV/KOVARI/docs/production-qa/phase-1/bug-g2b-mobile-fix-validation.md) for manual QA results.
