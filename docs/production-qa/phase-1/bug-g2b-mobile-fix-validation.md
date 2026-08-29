# BUG-G2b Mobile Fix Validation Guide

> **Status:** OPEN — HUMAN QA REQUIRED (Test G blocked: APK + Render SHA unverified, no device connected)

---

## 0. Post-RC-4 Deploy Gate (2026-08-29)

The results in Section 6 below are from **pre-RC-4** production QA unless superseded by a post-RC-4 run.

### Gate checklist (2026-08-29 ~09:54 IST)

| Gate | Status | Evidence |
| :--- | :--- | :--- |
| Vercel `app.kovari.in` on `b8be0510` | ✅ **Confirmed** | Dashboard + `vercel inspect app.kovari.in` |
| Render `kovari-socket` deployed + healthy | ✅ **Deployed / healthy** | Dashboard screenshot; `socket.kovari.in/health` → ok |
| Render deploy commit SHA | ❌ **UNKNOWN** | No deploy log access from agent; SHA not inferred |
| APK ≥ `d8029436` (`NotificationRealtimeBridge`) | ❌ **UNKNOWN** | `adb devices` empty — no test phone connected |
| Logcat bridge initialized | ❌ **Not captured** | Requires connected device |
| Test G Scenarios 1–6 post-RC-4 | ❌ **NOT RUN** | Blocked by APK gate |

**Decision:** Test G **not executed** in this session. Navneet must connect device, confirm APK, confirm Render SHA in dashboard, then run Scenarios 1–6.

**Do not mark BUG-G2b VERIFIED PASS** until all gates pass and Scenarios 1–6 pass.

## 1. Original Symptom (Test G)

When Account B submits a join request:

- Account A receives **no notification** on mobile.
- Account A's **Join Requests sheet does not update dynamically**.

Backend fix (commit `e9ad6bf8`) addressed notification creation and socket/FCM dispatch. This mobile task implements the **receiver-side bridge** only.

---

## 2. Mobile Root Cause

| Gap | Detail |
| :--- | :--- |
| Socket consumer | `ConversationRuntimeStore` only handles `new_notification` when `chatId` is present — non-chat payloads were dropped |
| No global bridge | No service invalidated `joinRequestsProvider(groupId)` on inbound events |
| FCM foreground | `router.dart` skipped foreground events; no provider refresh occurred |

---

## 3. Mobile Implementation

### Architecture

```text
Backend GROUP_JOIN_REQUEST_RECEIVED
        ↓
new_notification (socket) / FCM data
        ↓
NotificationRealtimeBridge  (single listener)
        ↓
dispatchInboundNotification()
        ↓
ref.invalidate(joinRequestsProvider(groupId))
ref.read(notificationProvider.notifier).refresh(ignoreCache: true)
ref.invalidate(unreadCountProvider)
        ↓
JoinRequestsSheet rebuilds via ref.watch(joinRequestsProvider)
```

### Files Changed

| File | Change |
| :--- | :--- |
| `apps/mobile/lib/core/notifications/inbound_notification_event.dart` | **New** — payload parsing, dedupe guard, pure dispatch logic |
| `apps/mobile/lib/core/notifications/notification_realtime_bridge.dart` | **New** — socket + FCM listeners, provider invalidation |
| `apps/mobile/lib/core/runtime/runtime_init.dart` | Wire bridge at app startup |
| `apps/mobile/test/runtime/notification_realtime_bridge_test.dart` | **New** — automated tests |

**Not changed:** `group_details_provider.dart`, backend, web, chat messaging paths.

---

## 4. Automated Tests

```bash
cd apps/mobile
flutter test test/runtime/notification_realtime_bridge_test.dart
flutter analyze lib/core/notifications lib/core/runtime/runtime_init.dart
```

| Test | Validates |
| :--- | :--- |
| Socket payload parsing | `entity_type` + `entity_id` → groupId |
| FCM payload parsing | `notificationId` field |
| Chat regression | `NEW_MESSAGE` + `chatId` → no bridge actions |
| Missing group id | Controlled diagnostic, no invalidation |
| Dedupe | Same id → no duplicate actions |
| MATCH_INTEREST | Interests refresh action (shared infra for R4) |

---

## 5. Web / Backend Regression

| Scope | Status |
| :--- | :--- |
| `apps/web/` | **Unchanged** |
| `packages/api/` | **Unchanged** |
| Socket server | **Unchanged** |
| Database | **Unchanged** |

---

## 6. Manual Production APK Protocol — Test G

> **Pre-RC-4 run (historical):** 2026-08-29 ~02:24 IST — results below.  
> **Post-RC-4 run:** **NOT EXECUTED** (2026-08-29 ~09:54 IST) — see Section 0 gate.

> **Executed (pre-RC-4):** 2026-08-29  
> **Operator:** Navneet  
> **Setup:** Account A — mobile app (admin/creator); Account B — web app (requester)  
> **Environment:** Production (`https://app.kovari.in/api/`)  
> **Builds under test:** Backend `e9ad6bf8` + Mobile bridge `d8029436` (verify deployment/APK inclusion)

### Summary

| Scenario | Description | Result |
| :--- | :--- | :--- |
| **1** | Foreground, Join Requests sheet open | **FAIL** — no dynamic list update; no notification |
| **2** | Foreground, elsewhere in app | **FAIL** — no notification; join list not updated on navigation |
| **3** | Background | **FAIL** — no background notification; state not updated on resume |
| **4** | Cold start from notification tap | **FAIL** — no notification to tap / data not fresh |
| **5** | BUG-G2 mutation regression (Tests A–F) | **PASS** |
| **6** | Chat regression spot check | **PASS** |

**Overall Test G: FAIL** — receiver-side join-request notification and dynamic Join Requests sync remain broken in production despite backend + mobile bridge implementation.

### Preconditions

- Backend fix deployed (commit `e9ad6bf8` or later).
- Mobile APK built from branch containing mobile bridge (`d8029436`).
- Account A: group creator/admin.
- Account B: separate account (web).

### Scenario 1 — Foreground, Join Requests sheet open

1. Account A opens group → Join Requests sheet.
2. Account B submits join request (web).
3. **Expected:** Request appears in list within ~2 s without manual refresh.
4. **Expected:** Notification badge/state updates.

| Result | PASS / FAIL |
| :--- | :--- |
| Join list updates dynamically | **FAIL** — no update |
| Notification state updates | **FAIL** — no notification |

### Scenario 2 — Foreground, elsewhere in app

1. Account A on Home or another tab (not Join Requests).
2. Account B submits join request (web).
3. **Expected:** In-app/local notification or badge update.
4. Navigate to Join Requests.
5. **Expected:** New request visible without pull-to-refresh.

| Result | PASS / FAIL |
| :--- | :--- |
| Notification received | **FAIL** |
| Join list correct on navigation | **FAIL** |

### Scenario 3 — Background

1. Account A backgrounds the mobile app.
2. Account B submits join request (web).
3. **Expected:** System notification appears (subject to BUG-N1a constraints).
4. Bring app to foreground.
5. **Expected:** Join Requests reflects new request.

| Result | PASS / FAIL |
| :--- | :--- |
| Background notification | **FAIL** |
| State after resume | **FAIL** |

### Scenario 4 — Cold start from notification tap

1. Account A force-closes app.
2. Account B submits join request (web).
3. Account A taps notification.
4. **Expected:** App opens to appropriate screen; join request data is current.

| Result | PASS / FAIL |
| :--- | :--- |
| Tap routing preserved | **FAIL** — no notification received to tap |
| Data fresh after open | **FAIL** |

### Scenario 5 — Regression (BUG-G2 Tests A–F)

Re-run mutation-side tests from [`bug-g2-fix-validation.md`](file:///c:/Users/navne/CSE/DEV/KOVARI/docs/production-qa/phase-1/bug-g2-fix-validation.md).

| Result | PASS / FAIL |
| :--- | :--- |
| Tests A–F still PASS | **PASS** |

### Scenario 6 — Chat regression spot check

1. Send direct message B → A while A is in app.
2. **Expected:** Message appears instantly; no duplicate notifications.

| Result | PASS / FAIL |
| :--- | :--- |
| Chat realtime intact | **PASS** |

---

## 6.1 Post-QA Analysis Notes

The mobile bridge and backend fixes did **not** resolve Test G in production QA. Regressions (Scenarios 5–6) confirm mutation-side G2 and chat paths remain intact.

**Likely investigation areas (not yet forensically confirmed on device):**

1. **Deployment gap** — production API / socket server may not include `e9ad6bf8`; APK may not include `d8029436`.
2. **Delivery path** — socket `new_notification` or FCM may still not reach Account A's mobile session (socket auth, Redis channel, FCM token, online suppression).
3. **Bridge activation** — `NotificationRealtimeBridge` may not be receiving events even if backend emits (runtime init, auth lifecycle, payload mismatch).
4. **BUG-N1a overlap** — background delivery failure may compound Scenario 3, but Scenarios 1–2 fail in foreground too — root cause is not background-only.

**Next engineering step:** Forensic trace on device/logcat with Account A online during web join-request — confirm whether notification DB row is created, socket event arrives, FCM fires, and bridge logs `[NotificationRealtimeBridge] Processing GROUP_JOIN_REQUEST_RECEIVED`.

---

## 7. Overlap Notes

- **BUG-R4:** Bridge includes `MATCH_INTEREST_RECEIVED` / `GROUP_INVITE_RECEIVED` refresh hooks. **BUG-R4 remains OPEN** until dedicated Requests-screen validation passes.
- **BUG-N1a:** Background FCM delivery lifecycle is **not fixed** by this bridge. Resume/tap hydration may improve; background delivery remains a separate defect.
- **BUG-N1b:** Foreground in-app banner behavior unchanged.

---

## 8. Pass Criteria

### Mobile bridge (this task)

- [x] Single `NotificationRealtimeBridge` wired at runtime init
- [x] Socket `new_notification` handled for non-chat types
- [x] FCM events trigger same refresh path (no forced navigation)
- [x] `joinRequestsProvider(groupId)` invalidated on `GROUP_JOIN_REQUEST_RECEIVED`
- [x] Chat `NEW_MESSAGE` not double-processed
- [x] Session dedupe + logout cleanup
- [x] Automated tests pass
- [x] No backend/web changes

### End-to-end BUG-G2b

- [ ] Test G PASS on production APK (all delivery scenarios)
- [x] Human QA executed (2026-08-29) — **FAIL** (Scenarios 1–4); regressions **PASS** (Scenarios 5–6)
- [ ] Engineering follow-up — delivery-path forensic on production device
