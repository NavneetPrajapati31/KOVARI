# BUG-N1a — Background Push Notification Delivery Fix Validation

> **Status:** **VERIFIED PASS — QA SIGN-OFF COMPLETE**  
> **Date:** 2026-08-30  
> **Forensic reference:** `bug-n1a-forensic-report.md`

---

## 1. Root Cause

**Round 1:** Background FCM handler was a no-op while process alive.  
**Round 2:** Local background display duplicated OS tray notifications; 15s per-chat dedupe blocked later foreground trays.  
**Round 3:** Chat `new_notification` socket emit targeted Clerk room only — mobile joins Supabase UUID room, so foreground Home received no tray. Residual data-only background local post showed “Open Kovari to view update” after swipe-away.

---

## 2. Fix Summary

| Round | Change | File |
| :--- | :--- | :--- |
| 1 | Background tray display, channels, leaveChat, batching, presence | `fcm_*`, `background_governor.dart`, `batching.ts`, `shouldSendPush.ts` |
| 2 | Skip duplicate local display when FCM has notification payload; message-level dedupe | `fcm_service.dart`, `fcm_background_notification.dart` |
| 3 | Fan-out chat socket to Clerk + Supabase rooms; background handler log-only | `events.ts`, `fcm_service.dart`, `conversation_runtime_store.dart` |

---

## 3. Automated Tests

| Suite | Result |
| :--- | :--- |
| `fcm_background_notification_test.dart` | **6/6 PASS** |
| `shouldSendPush.test.ts` | **9/9 PASS** |
| `batching.test.ts` | **2/2 PASS** |
| `flutter test` | **83/83 PASS** |

---

## 4. Manual Production QA

Use **two QA accounts**, **production backend**, and **release APK** (Round 3+ build).

| # | Scenario | Expected | Result |
| :--- | :--- | :--- | :--- |
| A | Foreground on Home — multiple messages | One tray notification per message | **PASS** |
| B | Background — single message; swipe away | Exactly one tray; no follow-up notification | **PASS** |
| C | Multiple background notifications | No loss / dupes | **PASS** |
| D | Cold start | One notification; tap routing OK | **PASS** |
| E | G2b regression | Join-request delivery + tap | **PASS** |
| F | Chat regression | Chat push + tap | **PASS** |

### Regression spot-checks

| Area | Expected | Result |
| :--- | :--- | :--- |
| G2 / G2b / G2b-TAP | Unchanged | **PASS** (E) |
| Chat tap routing / hydration | Unchanged | **PASS** (F) |
| BUG-N1b in-app Home banner | Out of N1a scope | **N/A** (separate bug) |

---

## 5. Sign-Off

**VERIFIED PASS — QA SIGN-OFF COMPLETE** (2026-08-30, physical production APK, Scenarios A–F).

Fix commits: `a79b64e2`, `030c6c53`, `718f9e13`.
