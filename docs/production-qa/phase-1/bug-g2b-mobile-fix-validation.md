# BUG-G2b Mobile Fix Validation Guide

> **Status:** MOBILE BRIDGE IMPLEMENTED — HUMAN QA REQUIRED

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

> **NOT PERFORMED BY ANTIGRAVITY — HUMAN QA REQUIRED**
>
> Navneet / Tirth must execute on physical Android devices with production APK against `https://app.kovari.in/api/`.

### Preconditions

- Backend fix deployed (commit `e9ad6bf8` or later).
- Mobile APK built from branch containing this mobile bridge.
- Account A: group creator/admin.
- Account B: separate account/device.

### Scenario 1 — Foreground, Join Requests sheet open

1. Account A opens group → Join Requests sheet.
2. Account B submits join request.
3. **Expected:** Request appears in list within ~2 s without manual refresh.
4. **Expected:** Notification badge/state updates.

| Result | PASS / FAIL |
| :--- | :--- |
| Join list updates dynamically | UNVERIFIED |
| Notification state updates | UNVERIFIED |

### Scenario 2 — Foreground, elsewhere in app

1. Account A on Home or another tab (not Join Requests).
2. Account B submits join request.
3. **Expected:** In-app/local notification or badge update.
4. Navigate to Join Requests.
5. **Expected:** New request visible without pull-to-refresh.

| Result | PASS / FAIL |
| :--- | :--- |
| Notification received | UNVERIFIED |
| Join list correct on navigation | UNVERIFIED |

### Scenario 3 — Background

1. Account A backgrounds the app.
2. Account B submits join request.
3. **Expected:** System notification appears (subject to BUG-N1a constraints).
4. Bring app to foreground.
5. **Expected:** Join Requests reflects new request.

| Result | PASS / FAIL |
| :--- | :--- |
| Background notification | UNVERIFIED |
| State after resume | UNVERIFIED |

### Scenario 4 — Cold start from notification tap

1. Account A force-closes app.
2. Account B submits join request.
3. Account A taps notification.
4. **Expected:** App opens to appropriate screen; join request data is current.

| Result | PASS / FAIL |
| :--- | :--- |
| Tap routing preserved | UNVERIFIED |
| Data fresh after open | UNVERIFIED |

### Scenario 5 — Regression (BUG-G2 Tests A–F)

Re-run mutation-side tests from [`bug-g2-fix-validation.md`](file:///c:/Users/navne/CSE/DEV/KOVARI/docs/production-qa/phase-1/bug-g2-fix-validation.md).

| Result | PASS / FAIL |
| :--- | :--- |
| Tests A–F still PASS | UNVERIFIED |

### Scenario 6 — Chat regression spot check

1. Send direct message B → A while A is in app.
2. **Expected:** Message appears instantly; no duplicate notifications.

| Result | PASS / FAIL |
| :--- | :--- |
| Chat realtime intact | UNVERIFIED |

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

- [ ] Test G PASS on production APK (all scenarios above)
- [ ] Human QA sign-off by Navneet / Tirth
