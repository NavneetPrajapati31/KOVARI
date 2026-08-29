# BUG-G2b Mobile Fix Validation Guide

> **Status:** **Test G delivery VERIFIED PASS** (Scenarios 1–6) — tap routing S3–S4 remains a **separate follow-up**

---

## 0. Post-RC-4 Deploy Gate (2026-08-29)

### Gate checklist

| Gate | Status | Evidence |
| :--- | :--- | :--- |
| Vercel `app.kovari.in` on `b8be0510` | ✅ **Confirmed** | Dashboard + `vercel inspect app.kovari.in` |
| Render `kovari-socket` deployed + healthy | ✅ **Deployed / healthy** | Dashboard; `socket.kovari.in/health` → ok |
| Render deploy commit SHA | ⚠️ **UNKNOWN** (not recorded by operator) | — |
| APK with `NotificationRealtimeBridge` + S2 fix | ✅ **Verified** (Scenario 2 PASS post-fix) | Operator QA 2026-08-29 ~11:25 IST |
| Test G Scenarios 1–6 (delivery) | ✅ **PASS** | §6A + §6B |
| Scenario 2 fix (`40e4884a`) | ✅ **VERIFIED PASS** | Production manual QA |
| Tap routing (S3–S4) | ⚠️ **Separate follow-up** | Opens group overview, not Join Requests sheet |

**Test G delivery: PASS.** Tap destination for background/cold-start notifications is **not** part of this sign-off — tracked separately.

---

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

### 6A. Post-RC-4 run (2026-08-29 ~10:27 IST) — pre Scenario 2 fix

> **Operator:** Navneet  
> **Setup:** Account A — mobile; Account B — web  
> **Backend:** Vercel **`b8be0510`**

#### Summary (pre-fix)

| Scenario | Result |
| :--- | :--- |
| **1** | **PASS** |
| **2** | **FAIL** — no notification |
| **3–4** | **PASS** (tap → group overview) |
| **5–6** | **PASS** |

---

### 6B. Post Scenario 2 fix (`40e4884a`) — **CURRENT**

> **Operator:** Navneet  
> **Date:** 2026-08-29 ~11:25 IST  
> **Fix:** `fix(mobile): show foreground notification for group join requests` (`40e4884a`)

#### Summary (current)

| Scenario | Description | Result |
| :--- | :--- | :--- |
| **1** | Foreground, Join Requests open | **PASS** |
| **2** | Foreground, elsewhere in app | **PASS** — visible local notification received |
| **3** | Background | **PASS** (tap routing: separate follow-up) |
| **4** | Cold start / notification tap | **PASS** (tap routing: separate follow-up) |
| **5** | BUG-G2 regression (A–F) | **PASS** |
| **6** | Chat regression | **PASS** |

**Overall Test G delivery: PASS**

#### Scenario 2 — Foreground, elsewhere (post-fix)

| Result | PASS / FAIL |
| :--- | :--- |
| Visible notification received | **PASS** |
| Join list fresh on navigation | *(assumed PASS — operator confirmed Scenario 2 PASS)* |

---

### 6A.1 Scenario 2 fix (implemented + verified)

**Change:** On socket-path `GROUP_JOIN_REQUEST_RECEIVED`, after provider refresh/invalidation, call `FCMService.instance.showLocalNotification()` (mirrors chat `ConversationRuntimeStore` pattern). FCM suppression policy **unchanged**. Tap routing **unchanged**.

| File | Change |
| :--- | :--- |
| `apps/mobile/lib/core/notifications/inbound_notification_event.dart` | Parse `title`/`message`; add `buildJoinRequestLocalNotification()` |
| `apps/mobile/lib/core/notifications/notification_realtime_bridge.dart` | Socket-only `_maybeShowJoinRequestLocalNotification()` |
| `apps/mobile/test/runtime/notification_realtime_bridge_test.dart` | +5 tests (18 total PASS) |

**Automated:** `flutter test test/runtime/notification_realtime_bridge_test.dart` — **18/18 PASS**

**Manual Scenario 2 re-test:** **PASS** (2026-08-29 ~11:25 IST, production APK with `40e4884a`)

**Logcat markers:** `[NotificationRealtimeBridge] Processing GROUP_JOIN_REQUEST_RECEIVED via socket` → `[NotificationRealtimeBridge] Showing local notification for group join request`

#### Scenario 1 — Foreground, Join Requests sheet open

| Result | PASS / FAIL |
| :--- | :--- |
| Join list updates dynamically | **PASS** |
| Notification state updates | **PASS** |

#### Scenario 2 — Foreground, elsewhere in app

| Result | PASS / FAIL |
| :--- | :--- |
| Notification received | **FAIL** — no notification |
| Join list correct on navigation | *(not reported — blocked by missing notification)* |

#### Scenario 3 — Background

| Result | PASS / FAIL |
| :--- | :--- |
| Background notification | **PASS** |
| State after resume | **PASS** (data current) |
| Tap opens Join Requests sheet | **FAIL (UX)** — opens **group overview** instead |

#### Scenario 4 — Cold start from notification tap

| Result | PASS / FAIL |
| :--- | :--- |
| Notification available | **PASS** |
| Tap routing | **PARTIAL** — opens **group overview**, not Join Requests sheet |
| Data fresh after open | **PASS** |

#### Scenario 5 — Regression (BUG-G2 Tests A–F)

| Result | PASS / FAIL |
| :--- | :--- |
| Tests A–F still PASS | **PASS** |

#### Scenario 6 — Chat regression spot check

| Result | PASS / FAIL |
| :--- | :--- |
| Chat realtime intact | **PASS** |

---

### 6B. Pre-RC-4 run (2026-08-29 ~02:24 IST) — historical

> **Builds under test:** Backend `e9ad6bf8` + Mobile bridge `d8029436` (pre dual-room RC-4)

#### Summary

| Scenario | Description | Result |
| :--- | :--- | :--- |
| **1** | Foreground, Join Requests sheet open | **FAIL** — no dynamic list update; no notification |
| **2** | Foreground, elsewhere in app | **FAIL** — no notification; join list not updated on navigation |
| **3** | Background | **FAIL** — no background notification; state not updated on resume |
| **4** | Cold start from notification tap | **FAIL** — no notification to tap / data not fresh |
| **5** | BUG-G2 mutation regression (Tests A–F) | **PASS** |
| **6** | Chat regression spot check | **PASS** |

**Overall Test G (pre-RC-4): FAIL** — receiver-side delivery broken (socket room mismatch; see forensic report).

### Preconditions

- Backend fix deployed (commit `b8be0510` or later for post-RC-4).
- Mobile APK built from branch containing mobile bridge (`d8029436`).
- Account A: group creator/admin.
- Account B: separate account (web).

### Pre-RC-4 scenario detail (historical)

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

### Post-RC-4 (2026-08-29)

RC-4 (`b8be0510`) ** materially improved** receiver-side delivery:

| Area | Pre-RC-4 | Post-RC-4 |
| :--- | :--- | :--- |
| Join Requests dynamic sync (sheet open) | FAIL | **PASS** (Scenario 1) |
| Foreground notification (elsewhere in app) | FAIL | **PASS** (post `40e4884a`) |
| Background FCM delivery | FAIL | **PASS** (Scenario 3) |
| Cold-start notification | FAIL | **PASS** (Scenario 4) |
| G2 mutation / chat regressions | PASS | **PASS** |

**Scenario 2 forensic (2026-08-29):** See [`bug-g2b-scenario-2-foreground-forensic-report.md`](file:///c:/Users/navne/CSE/DEV/KOVARI/docs/production-qa/phase-1/bug-g2b-scenario-2-foreground-forensic-report.md).

**First failed stage:** Mobile foreground visible notification presentation (after socket + bridge silent refresh).

**Verified root cause (code-proven):** FCM suppressed while UUID socket room occupied; `NotificationRealtimeBridge` only invalidates providers and does **not** call `FCMService.showLocalNotification` (unlike chat's `ConversationRuntimeStore`). Scenario 1 passes because `JoinRequestsSheet` is the visible feedback surface.

**Scenario 2 fix verified:** PASS post `40e4884a` (2026-08-29 ~11:25 IST).

**Remaining (separate task):** Tap routing for Scenarios 3–4 — notification tap opens group overview, not Join Requests sheet.

### Pre-RC-4 (historical)

The mobile bridge and backend RC-1–RC-3 did **not** resolve Test G before RC-4. Root cause was socket room mismatch (forensic report). Regressions (Scenarios 5–6) confirmed mutation-side G2 and chat paths remained intact.

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

- [x] Test G delivery sign-off (2026-08-29)
- [x] Scenario 1 PASS — dynamic Join Requests sync
- [x] Scenario 2 PASS — foreground notification elsewhere in app (**VERIFIED** post `40e4884a`)
- [x] Scenarios 3–4 PASS — push delivery
- [x] Scenarios 5–6 PASS — regressions intact
- [ ] Notification tap opens Join Requests sheet — **separate follow-up** (opens group overview today)
