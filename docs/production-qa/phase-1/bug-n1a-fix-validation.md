# BUG-N1a — Background Push Notification Delivery Fix Validation

> **Status:** **FIX IMPLEMENTED — HUMAN QA REQUIRED** (Round 3)  
> **Date:** 2026-08-30  
> **Forensic reference:** `bug-n1a-forensic-report.md`

---

## 1. Root Cause

**Round 1:** Background FCM handler was a no-op while process alive.  
**Round 2:** Local background display duplicated OS tray notifications; 15s per-chat dedupe blocked later foreground trays.  
**Round 3:** Chat `new_notification` socket emit targeted Clerk room only — mobile joins Supabase UUID room, so foreground Home received no tray. Residual data-only background local post showed “Open Kovari to view update” after swipe-away.

---

## 2. Fix Summary

### Round 3 (this fix)

| Change | File |
| :--- | :--- |
| Fan-out chat `new_notification` to Clerk **and** Supabase socket rooms | `events.ts` |
| Background FCM handler is log-only (no local tray) | `fcm_service.dart` |
| Include `messageId` in socket-path local notification data | `conversation_runtime_store.dart` |

### Prior rounds

See `bug-n1a-forensic-report.md` sections 6 and 10.

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

| # | Scenario | Expected | Round 3 result | Round 4 retest |
| :--- | :--- | :--- | :--- | :--- |
| A | Foreground on Home — multiple messages | One tray notification per message | **FAIL** — no tray | **PENDING** |
| B | Background — single message | Exactly one tray; no follow-up after swipe | **PASS** with stray “view update” after swipe | **PENDING** |
| C | Multiple background notifications | No loss / dupes | **PASS** | — |
| D | Cold start | One notification; tap routing OK | **PASS** | — |
| E | G2b regression | Join-request delivery + tap | **PASS** | — |
| F | Chat regression | Chat push + tap | **PASS** | — |

### Round 3 physical evidence (2026-08-30)

- **A:** App foreground on Home; web sends chat → no tray notification.
- **B:** Background delivery works; swiping away first notification triggered a second generic “Open Kovari to view update” card.
- **C–F:** Pass.

---

## 5. Sign-Off

**FIX IMPLEMENTED — HUMAN QA REQUIRED** (Round 3)

Retest **A** and **B** after Round 3 fix + redeploy (socket server + mobile APK). Do not mark **VERIFIED PASS** until A passes and B has no post-swipe stray notification.
