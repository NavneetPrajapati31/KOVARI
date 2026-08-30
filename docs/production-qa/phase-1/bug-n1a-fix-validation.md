# BUG-N1a — Background Push Notification Delivery Fix Validation

> **Status:** **FIX IMPLEMENTED — HUMAN QA REQUIRED**  
> **Date:** 2026-08-30  
> **Forensic reference:** `bug-n1a-forensic-report.md`

---

## 1. Root Cause

**First failed stage: E — Android background handling**

The Flutter FCM background handler did not display system-tray notifications when the app process was alive but backgrounded. Secondary factors: chat batching delay for offline recipients, supabase/clerk presence key mismatch, and stale chat room presence on background.

---

## 2. Fix Summary

| Change | File |
| :--- | :--- |
| Explicit tray display in background FCM isolate | `fcm_background_notification.dart`, `fcm_service.dart` |
| High-importance notification channels + manifest defaults | `fcm_service.dart`, `AndroidManifest.xml` |
| Leave chat + disconnect socket on background | `background_governor.dart` |
| Immediate chat push when recipient offline | `batching.ts` |
| Supabase-scoped `user_chats` presence for NEW_MESSAGE | `shouldSendPush.ts` |

---

## 3. Automated Tests

| Suite | Result |
| :--- | :--- |
| `fcm_background_notification_test.dart` | **4/4 PASS** |
| `shouldSendPush.test.ts` | **9/9 PASS** |
| `batching.test.ts` | **2/2 PASS** |
| `flutter test` | **81/81 PASS** |
| `flutter analyze lib` | **PASS** |

---

## 4. Manual Production QA (Required)

Use **two QA accounts**, **production backend**, and **release APK** built from this fix branch.

| # | Scenario | Expected | Result |
| :--- | :--- | :--- | :--- |
| A | Foreground notification | Existing foreground tray behavior intact | **PENDING** |
| B | Background notification | Tray notification appears without reopening app | **PENDING** |
| C | Multiple background notifications | No loss, no unintended dupes, correct content | **PENDING** |
| D | Cold start | Notification arrives; tap routing unchanged | **PENDING** |
| E | G2b regression | Join-request delivery + dynamic Join Requests + tap routing | **PENDING** |
| F | Chat regression | Chat push delivery, presentation, tap routing | **PENDING** |

### APK

| Field | Value |
| :--- | :--- |
| Build | **PENDING** — release APK after merge |
| Version | **PENDING** |

---

## 5. Sign-Off

**FIX IMPLEMENTED — HUMAN QA REQUIRED**

Do not update `mobile_regression_matrix.md` N1 row or mark **VERIFIED PASS** until Scenarios A–F pass on a physical production APK.
