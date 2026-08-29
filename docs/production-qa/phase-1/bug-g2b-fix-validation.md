# BUG-G2b Backend Fix Validation Guide

> **Status:** OPEN — **PARTIAL PASS** post-RC-4 Test G (Scenario 2 FAIL; tap routing defect on 3–4)

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
- [x] Delivery-path RC-4 dual-room + FCM alignment (`b8be0510`)
- [x] Vercel production deploy confirmed
- [x] Post-RC-4 Test G executed (2026-08-29 ~10:27 IST) — **PARTIAL PASS**
- [x] Scenario 1 PASS
- [ ] Scenario 2 PASS (**FAIL** — no notification elsewhere in app)
- [x] Scenarios 3–4 PASS (tap routing defect: group overview vs Join Requests sheet)
- [x] Scenarios 5–6 PASS
- [ ] Full VERIFIED PASS sign-off

See [`bug-g2b-mobile-fix-validation.md`](file:///c:/Users/navne/CSE/DEV/KOVARI/docs/production-qa/phase-1/bug-g2b-mobile-fix-validation.md) for manual QA results.

---

## 10. Production Deployment Verification (2026-08-29)

Verification performed after RC-4 commit `b8be0510` merged to `master`. Git presence alone is not treated as deployed.

### 10.1 Vercel (Next.js API — `app.kovari.in`)

| Field | Value |
| :--- | :--- |
| **Commit SHA** | `b8be0510` (short: `b8be051`) |
| **Branch** | `master` |
| **Environment** | Production |
| **Deployment ID** | `dpl_DS6qfDr3NHJf2grgr1Ed56V9Z8EN` |
| **Deployment URL** | `https://kovari-eiplrcbbf-navneet31.vercel.app` |
| **Aliases** | `app.kovari.in`, `kovari.in`, `www.kovari.in` |
| **Status** | **Ready** (deploy ~09:42 IST, confirmed live via `vercel inspect app.kovari.in`) |
| **Evidence** | Vercel dashboard screenshot (navneet316, Production, Ready 3m 39s); CLI alias resolves to this deployment |

**Smoke:** `GET https://app.kovari.in/api/health` → `200`, `status: ok` (2026-08-29T04:20:54Z).

**Required ancestors on this deploy:** `e9ad6bf8` (RC-1–RC-3), `d8029436` (mobile bridge in repo), `b8be0510` (RC-4 dual-room + FCM).

### 10.2 Render (Socket.IO — `socket.kovari.in` / `kovari-socket`)

| Field | Value |
| :--- | :--- |
| **Service** | `kovari-socket` |
| **Status** | **Deployed** (Render dashboard screenshot, 2026-08-29 ~09:50 IST) |
| **Region** | Singapore |
| **Commit SHA** | **UNKNOWN** |
| **Health** | `GET https://socket.kovari.in/health` → `{"status":"ok"}`; `GET /` → `Socket server running` (2026-08-29T04:25Z) |

**SHA verification attempt (2026-08-29 ~09:54 IST):**

| Method | Result |
| :--- | :--- |
| Render deploy log / dashboard commit field | **Not accessible** — no Render CLI, no Render API credentials, no browser session to dashboard in agent environment |
| Socket `/health` response | No `commit` / `sha` field exposed (returns `{ status: "ok" }` only) |
| Infer from deploy timing | **Not used** (explicitly disallowed) |

**Conclusion:** Render service is **healthy and deployed**, but **RC-4 commit SHA is not proven at runtime**. Confirm `b8be0510` manually in Render → `kovari-socket` → Events/Logs → deploy commit before closing BUG-G2b.

### 10.3 APK (Account A test device)

| Field | Value |
| :--- | :--- |
| **versionName** | **UNKNOWN** |
| **versionCode** | **UNKNOWN** |
| **Build timestamp** | **UNKNOWN** |
| **Source commit** | **UNKNOWN** |

**APK verification attempt (2026-08-29 ~09:54 IST):**

```text
adb devices → (empty — no test device connected to agent host)
```

**Gate:** Per Test G protocol, **Test G was NOT executed** because APK bridge commit (`d8029436`+) could not be confirmed. Install/rebuild APK from `master` ≥ `d8029436`, record versionName/versionCode, then re-run.

### 10.4 Test G — Post-RC-4 Deploy (2026-08-29 ~10:27 IST)

**Operator:** Navneet | **Backend:** Vercel `b8be0510`

| Scenario | Description | Result |
| :--- | :--- | :--- |
| **1** | Foreground, Join Requests open | **PASS** |
| **2** | Foreground, elsewhere | **FAIL** — no notification |
| **3** | Background | **PASS** — tap opens group overview (not Join Requests sheet) |
| **4** | Cold start / notification tap | **PASS** — same tap routing defect as Scenario 3 |
| **5** | BUG-G2 regression (A–F) | **PASS** |
| **6** | Chat regression | **PASS** |

**Overall: PARTIAL PASS.** First failed stage for strict sign-off: **Scenario 2** (foreground notification when elsewhere in app).

See [`bug-g2b-mobile-fix-validation.md`](file:///c:/Users/navne/CSE/DEV/KOVARI/docs/production-qa/phase-1/bug-g2b-mobile-fix-validation.md) §6A for detail.

### 10.5 FCM / runtime pipeline (not verified this session)

No production Account A/B session was available in the agent environment. Do not infer FCM suppress/deliver without device QA or Supabase `notifications.push_status` rows from a live join-request attempt.

**Expected pipeline after RC-4 (code-proven, runtime unverified):**

```text
join-request POST → notifyGroupJoinRequestRecipients → createNotification
  → after() → emitRealtimeNotification(clerkId + supabaseId) → Redis
  → Render subscriber → io.to(user_socket:{clerkId}) + io.to(user_socket:{uuid})
  → NotificationRealtimeBridge → joinRequestsProvider invalidation
```

### 10.6 BUG-G2b status gate

| Condition | Status |
| :--- | :--- |
| RC-4 code committed | ✅ `b8be0510` |
| Vercel production deploy | ✅ Confirmed |
| Render socket healthy | ✅ Confirmed |
| Render RC-4 SHA confirmed | ⚠️ **UNKNOWN** |
| Post-RC-4 Test G executed | ✅ 2026-08-29 ~10:27 IST |
| Scenario 1 PASS | ✅ |
| Scenario 2 PASS | ❌ **FAIL** |
| Scenarios 3–4 PASS | ✅ (tap routing defect) |
| Scenarios 5–6 PASS | ✅ |

**Final status: OPEN — PARTIAL PASS** (Scenario 2 forensic complete; fix not implemented).

**Forensic report:** [`bug-g2b-scenario-2-foreground-forensic-report.md`](file:///c:/Users/navne/CSE/DEV/KOVARI/docs/production-qa/phase-1/bug-g2b-scenario-2-foreground-forensic-report.md)
