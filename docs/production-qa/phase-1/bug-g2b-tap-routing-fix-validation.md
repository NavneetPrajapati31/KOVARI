# BUG-G2b-TAP — Notification Tap Routing Fix Validation

> **Status:** **VERIFIED PASS — QA SIGN-OFF COMPLETE**  
> **Date:** 2026-08-29  
> **Fix commit:** `0a7ca12b` — `fix(mobile): route join request notifications to requests sheet`  
> **Parent:** BUG-G2b delivery — **VERIFIED PASS (closed)** — separate UX fix, now also closed  
> **Forensic reference:** `bug-g2b-tap-routing-forensic-report.md`

---

## 1. Defect Summary

When Account A taps a `GROUP_JOIN_REQUEST_RECEIVED` notification (background / cold-start / foreground local tray), the app opened the correct group at **Group Overview** instead of **Settings → Join Requests sheet**.

---

## 2. Fix Summary

| Layer | Change |
| :--- | :--- |
| **Router** | Type-aware branch: `GROUP_JOIN_REQUEST_RECEIVED` → `/groups/{id}?tab=3&sheet=joinRequests` |
| **Route** | Parse `sheet` query param → `GroupDetailsScreen.initialSheet` |
| **Screen** | After group + membership load, auto-present `JoinRequestsSheet` (admin/creator only, one-shot) |

**Not modified:** FCM, socket, bridge, backend, G2 mutations.

---

## 3. Files Changed

```text
apps/mobile/lib/core/navigation/router.dart
apps/mobile/lib/core/navigation/routes.dart
apps/mobile/lib/features/groups/screens/group_details_screen.dart
apps/mobile/test/runtime/notification_tap_routing_test.dart  (new)
```

---

## 4. Automated Test Results

| Suite | Result |
| :--- | :--- |
| `notification_tap_routing_test.dart` | **10/10 PASS** |
| Full `flutter test` | **53/53 PASS** |
| `flutter analyze lib` | No new errors from this change |

### Unit test coverage

- Join request → `/groups/abc?tab=3&sheet=joinRequests`
- Group invite → `/groups/abc` (unchanged)
- Group join approved → `/groups/abc` (unchanged)
- Correct `entity_id` in path
- Admin/creator authorization gate
- Demoted user blocked
- One-shot sheet guard
- Unknown sheet token blocked

---

## 5. Manual Production QA Checklist

Use two accounts on **physical Android device** with production config.

| # | Scenario | Steps | Expected | Result |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Background tap | A backgrounds → B requests → A taps notification | Correct group, Settings tab, Join Requests sheet | **PASS** |
| 2 | Cold-start tap | Force-close A → B requests → A taps notification | Same as #1 | **PASS** |
| 3 | Foreground local tap | A elsewhere in app → receives tray notif → taps | Same as #1 | **PASS** |
| 4 | Normal group notification | Tap `GROUP_INVITE_RECEIVED` or similar | Group Overview only | **PASS** |
| 5 | Authorization | Demoted/non-admin recipient taps join-request notif | Settings tab, **no** sheet | **PASS** |
| 6 | BUG-G2 regression | Tests A–F (join/accept/reject/remove/leave) | PASS | **PASS** |
| 7 | Chat regression | DM + group chat notification taps | Unchanged routing | **PASS** |

**Overall:** **VERIFIED PASS** — production APK manual QA (2026-08-29 ~12:57 IST, operator Navneet).

---

## 6. APK

| Item | Status |
| :--- | :--- |
| Release APK built | ✅ **Verified** |
| Installed on physical device | ✅ **Verified** |
| Production backend (`app.kovari.in`) | ✅ Used for QA |

---

## 7. Regression Notes

| System | Expected |
| :--- | :--- |
| BUG-G2b delivery (S1–S6) | Unaffected — delivery stack frozen |
| BUG-G2 mutations | Unaffected — `group_details_provider.dart` not modified |
| Chat notifications | Unaffected — chat router branches unchanged |
| Web notifications | Unaffected — no web changes |

---

## 8. Sign-Off Criteria

**VERIFIED PASS — QA SIGN-OFF COMPLETE** (2026-08-29):

- [x] Physical-device Scenarios 1–7 all PASS
- [x] Release APK verified on device
- [x] BUG-G2 + chat regressions confirmed on device
- [x] Bug tracker updated
- [x] Regression matrix updated (post-reconciliation)
