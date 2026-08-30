# BUG-N1a — Background Push Notification Delivery Fix Validation

> **Status:** **FIX IMPLEMENTED — HUMAN QA REQUIRED** (Round 2)  
> **Date:** 2026-08-30  
> **Forensic reference:** `bug-n1a-forensic-report.md`

---

## 1. Root Cause

**First failed stage (Round 1): E — Android background handling**

**Round 2 QA regressions (physical APK):**

| Scenario | Result | Cause |
| :--- | :--- | :--- |
| **A** Foreground | **FAIL** | 15s per-chat dedupe suppressed later tray notifications; `inactive` lifecycle also disconnected the socket during notification interactions |
| **B** Background | **FAIL** | Double tray: OS auto-display of FCM `notification` payload **plus** Round 1 local display in background handler |
| **D** Cold start | **FAIL** | Same double-display as B |

---

## 2. Fix Summary

### Round 1

| Change | File |
| :--- | :--- |
| Explicit tray display in background FCM isolate | `fcm_background_notification.dart`, `fcm_service.dart` |
| High-importance notification channels + manifest defaults | `fcm_service.dart`, `AndroidManifest.xml` |
| Leave chat + disconnect socket on background | `background_governor.dart` |
| Immediate chat push when recipient offline | `batching.ts` |
| Supabase-scoped `user_chats` presence for NEW_MESSAGE | `shouldSendPush.ts` |

### Round 2

| Change | File |
| :--- | :--- |
| Skip local background display when FCM already has a `notification` payload (prevents doubles) | `fcm_background_notification.dart`, `fcm_service.dart` |
| Replace 15s per-chat dedupe with 3s message-level dedupe | `fcm_service.dart` |
| Do not disconnect socket on `inactive` — only on `paused`/`hidden` | `background_governor.dart` |

---

## 3. Automated Tests

| Suite | Result |
| :--- | :--- |
| `fcm_background_notification_test.dart` | **6/6 PASS** (incl. Round 2 duplicate-guard tests) |
| `shouldSendPush.test.ts` | **9/9 PASS** (Round 1) |
| `batching.test.ts` | **2/2 PASS** (Round 1) |
| `flutter test` | **83/83 PASS** |
| `flutter analyze` (touched files) | **PASS** |

---

## 4. Manual Production QA

Use **two QA accounts**, **production backend**, and **new Round 2 release APK**.

| # | Scenario | Expected | Result |
| :--- | :--- | :--- | :--- |
| A | Foreground on Home (not in chat) — multiple messages spaced &gt;3s | One tray notification per message; tap opens correct chat | **FAIL Round 1 APK** → retest Round 2 |
| B | Background — single message | **Exactly one** tray notification without reopening | **FAIL Round 1 APK (double)** → retest Round 2 |
| C | Multiple background notifications | No loss, no unintended dupes | **SKIPPED** → retest Round 2 |
| D | Cold start | **Exactly one** notification; tap routing unchanged | **FAIL Round 1 APK (double)** → retest Round 2 |
| E | G2b regression | Join-request delivery + dynamic Join Requests + tap routing | **SKIPPED** → retest Round 2 |
| F | Chat regression | Chat push delivery, presentation, tap routing | **SKIPPED** → retest Round 2 |

### Round 1 physical evidence (2026-08-30)

- **A:** First foreground Home notification worked; after opening chat and returning to Home, later messages updated inbox but **no tray notification**.
- **B:** Screenshot showed **two identical** “New message / Open Kovari to view message” cards at once.
- **D:** Same double-notification behavior on cold start.

### APK

| Field | Value |
| :--- | :--- |
| Round 1 build | Tested — A/B/D FAIL |
| Round 2 build | **PENDING** — rebuild after Round 2 commit |

---

## 5. Sign-Off

**FIX IMPLEMENTED — HUMAN QA REQUIRED** (Round 2)

Do not update `mobile_regression_matrix.md` N1 row or mark **VERIFIED PASS** until Scenarios A–F pass on a physical production APK **without duplicates**.
