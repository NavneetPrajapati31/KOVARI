# BUG-N1a — Background Push Notification Delivery Forensic Report

> **Status:** **VERIFIED PASS — QA SIGN-OFF COMPLETE**  
> **Date:** 2026-08-30  
> **Platform:** Mobile / Android (production APK)

---

## 1. Original Production Failure

**Source:** `tirth_day2_qa.md` — Scenario N1 (Push Delivery)

| App state | Result |
| :--- | :--- |
| Killed (force-closed) | **PASS** — notification arrived ~1–2s after send |
| Background (Home pressed) | **FAIL** — no tray notification while backgrounded; appeared only after reopen |
| Foreground | System notification works; in-app banner missing (**BUG-N1b**, separate) |

**Symptom pattern:** FCM reaches the device in killed state but not while the Flutter process remains alive in background.

---

## 2. Reproduction Evidence

Production QA (Tirth, Day 2) confirmed:

1. Account A foreground → notification works.
2. Account A backgrounded → Account B sends chat message → **no tray notification**.
3. Account A reopened → notification becomes visible.

Cold-start delivery already worked, isolating the defect to **background lifecycle** (process alive, not foreground).

---

## 3. FCM Path Trace

```text
Backend notification creation (createNotification / batching)
        ↓
FCM eligibility (shouldSendPush)
        ↓
FCM send (pushService — priority: high, channelId, data payload)
        ↓
Firebase Cloud Messaging
        ↓
Android background delivery
        ↓
Flutter Firebase Messaging background handler
        ↓
System tray notification display
        ↓
Tap routing (onMessageOpenedApp — unchanged)
```

### Stage-by-stage findings

| Stage | Finding |
| :--- | :--- |
| **A. Backend creation** | Notifications are created; batching may delay chat push up to 10s when socket rooms appear occupied. |
| **B. FCM eligibility** | `shouldSendPush` section 2b checked `user_chats:{clerkId}` while mobile presence uses `user_chats:{supabaseUuid}` — stale suppression possible but not the primary background tray failure. |
| **C. FCM dispatch** | `pushService.ts` sends with `android.priority: "high"` and correct `channelId` — no dispatch failure identified. |
| **D. Firebase delivery** | Killed-state PASS proves FCM tokens and Firebase delivery work. |
| **E. Android background handling** | **First failed stage.** `_firebaseMessagingBackgroundHandler` was a no-op (log only). Comment assumed FCM auto-displays tray notifications — false when process is alive but backgrounded on tested Android builds. |
| **F. Notification presentation** | Matches/groups channels lacked `Importance.high`; no default FCM channel/icon in manifest. |
| **G. Lifecycle/configuration** | `BackgroundGovernor` disconnected socket on background but did not `leaveChat`, leaving stale `user_chats` presence; chat batching held 10s timer when clerk socket room still appeared online after disconnect race. |

---

## 4. First Failed Stage

**Classification: E — Android background handling**

FCM messages arrive at the device in background, but the registered Flutter background handler did not display a system-tray notification. Notifications surfaced only when the app returned to foreground and foreground listeners / local state caught up.

Contributing factors (not primary):

- **F** — channel importance / manifest defaults for auto-display fallback
- **G** — stale chat presence + 10s batching delay for offline recipients

---

## 5. Root Cause

1. **Primary:** `apps/mobile/lib/core/services/fcm_service.dart` — `_firebaseMessagingBackgroundHandler` only logged the message. On Android, when the app process is backgrounded (not killed), FCM data+notification messages may not auto-render in the system tray without explicit `flutter_local_notifications` display in the background isolate.

2. **Secondary (chat latency):** `apps/web/src/services/notifications/batching.ts` — 10s debounce ran even when the recipient had zero active sockets (fully backgrounded/offline), delaying FCM dispatch.

3. **Secondary (presence):** `shouldSendPush` section 2b used clerk-scoped `user_chats` keys while mobile `PresenceManager` tracks `user_chats:{supabaseUuid}`.

4. **Secondary (lifecycle):** `BackgroundGovernor` disconnected socket without leaving active chat rooms, potentially leaving stale presence until TTL.

---

## 6. Fix Summary

| Change | File |
| :--- | :--- |
| Background isolate shows tray notification via `flutter_local_notifications` | `fcm_background_notification.dart` (**new**), `fcm_service.dart` |
| `Importance.high` on matches/groups channels | `fcm_service.dart`, `fcm_background_notification.dart` |
| Default FCM channel + icon meta-data | `AndroidManifest.xml` |
| Leave active chat + clear `activeConversationProvider` on background | `background_governor.dart` |
| Immediate batch flush when recipient has zero sockets | `batching.ts` |
| Supabase-scoped `user_chats` presence check for NEW_MESSAGE | `shouldSendPush.ts` |

**Frozen (unchanged):** G2/G2b/G2b-TAP delivery stack, `NotificationRealtimeBridge`, tap routing, `REALTIME_SOCKET_DELIVERED_TYPES` suppression for join requests.

---

## 7. Affected Files

```text
apps/mobile/lib/core/services/fcm_background_notification.dart   (new)
apps/mobile/lib/core/services/fcm_service.dart
apps/mobile/lib/core/runtime/background_governor.dart
apps/mobile/android/app/src/main/AndroidManifest.xml
apps/web/src/services/notifications/batching.ts
apps/web/src/services/notifications/shouldSendPush.ts
apps/mobile/test/runtime/fcm_background_notification_test.dart     (new)
apps/web/src/services/notifications/batching.test.ts             (new)
apps/web/src/services/notifications/shouldSendPush.test.ts       (extended)
```

---

## 8. Automated Test Results

| Suite | Result |
| :--- | :--- |
| `fcm_background_notification_test.dart` | **4/4 PASS** |
| `shouldSendPush.test.ts` (incl. G2b + NEW_MESSAGE regression) | **9/9 PASS** |
| `batching.test.ts` | **2/2 PASS** |
| `flutter test` (full mobile suite) | **81/81 PASS** |
| `flutter analyze lib` | **PASS** (no new errors from N1a changes) |

---

## 9. Regression Protection

| Area | Expected | Automated coverage |
| :--- | :--- | :--- |
| G2b `GROUP_JOIN_REQUEST_RECEIVED` eligibility | Unchanged | `shouldSendPush.test.ts` |
| Chat `NEW_MESSAGE` suppression when viewing room | Unchanged | `shouldSendPush.test.ts` |
| Chat batching when online | 10s debounce preserved | `batching.test.ts` |
| Tap routing | Unchanged | `notification_tap_routing_test.dart` (existing) |

Physical regression (G2b, G2b-TAP, chat, cold start, multi-notif) — **pending human QA**.

---

## 10. Round 2 — Physical QA Failure (2026-08-30)

| Scenario | Result | Evidence |
| :--- | :--- | :--- |
| A Foreground (Home) | **FAIL** | First tray OK; after open chat → Home, later msgs updated inbox but no tray |
| B Background | **FAIL** | Two identical “New message” tray cards |
| D Cold start | **FAIL** | Same doubles as B |

### Round 2 root causes

1. **Doubles (B/D):** Round 1 always called `showBackgroundFcmNotification`. Production FCM includes a `notification` payload, so Android already posts to the tray; the handler posted a second local notification.
2. **Foreground gap (A):** `_shouldShowNotification` used a **15s per-chat** window, suppressing later legitimate messages. Separately, treating `AppLifecycleState.inactive` as background disconnected the socket during notification-shade / transitional UI.

### Round 2 fix

- Gate background local display with `shouldDisplayBackgroundFcmLocally` (data-only only).
- Message-level 3s dedupe instead of 15s per-chat.
- Disconnect socket only on `paused`/`hidden`, not `inactive`.

### Round 3 fix

- Fan-out chat `new_notification` to both Clerk and Supabase `user_socket` rooms (foreground Home path).
- Background FCM handler log-only — no local “view update” fallback tray post.
- Socket local notification includes `messageId` for dedupe with FCM.

---

## 11. Sign-Off

**VERIFIED PASS — QA SIGN-OFF COMPLETE** (2026-08-30). Physical production APK: Scenarios A–F **PASS** after Round 3 fix (`718f9e13`). See `bug-n1a-fix-validation.md`.
