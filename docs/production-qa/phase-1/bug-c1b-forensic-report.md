# BUG-C1b — Chat Notification Message Rendering Forensic Report

> **Status:** **VERIFIED PASS — QA SIGN-OFF COMPLETE**  
> **Date:** 2026-08-30  
> **Validation:** `bug-c1b-fix-validation.md`

---

## A. Symptom

Tapping a chat push notification opens the **correct** conversation, but the latest incoming message is **not immediately visible**. The user must wait, scroll, or refresh before messages appear.

**Routing works.** This is a hydration/timing defect, not a deep-link routing defect.

**Out of scope:** BUG-C1a (multi-account session leakage) — handled separately by Tirth.

---

## B. Reproduction (production)

1. Account A (mobile) backgrounded or force-closed.
2. Account B sends a new direct message.
3. Account A receives push notification and taps it.
4. Chat screen opens to the correct room but latest message is missing briefly (or shows “No messages yet”).

---

## C. Trace — Notification → Conversation

```text
FCM / local notification tap
  → FCMService._handleNotificationTap / onDidReceiveNotificationResponse
  → FCMService.onNotificationEvent stream
  → router.dart entity_type=chat branch
  → router.push('/chat/:chatId')
  → ChatScreen mount
  → messageStoreProvider build() → Future.microtask(_hydrate)
  → postFrameCallback → joinChat() → resync(forceRefresh: true) → _hydrate again
```

FCM payload (privacy-safe) contains only `{ entity_type: 'chat', entity_id: chatId }` — **no message body** for immediate injection.

---

## D. First Failed Stage

**`MessageStore._hydrate()` — remote message fetch completes with zero messages while `isHydrating` clears to false.**

Three interacting causes:

| # | Failure | Evidence |
| :--- | :--- | :--- |
| 1 | **Concurrent hydrates** | `build()` microtask `_hydrate()` races with `joinChat().resync()` (`message_store.dart`, `realtime_coordinator.dart:63-65`). First completion sets `isHydrating=false` before second fetch finishes. |
| 2 | **Stale delta sync** | `ConversationSyncEngine.syncDelta` uses `afterSequence = metadata.lastSequence`. When message cache is empty but metadata says `lastSequence > 0`, delta returns **zero messages** and UI stays empty until socket `receive_message`. |
| 3 | **Partner unresolved on cold start** | Direct-chat REST fetch skipped when `directChatPartnerId()` returns null before `resolvedUuid` is available. No retry was scheduled when auth UUID arrived. |

**Misleading UI:** `chat_screen.dart` showed `_EmptyState` (“No messages yet”) whenever `!isHydrating && messages.isEmpty`, even when hydration had not definitively succeeded.

Messages eventually appeared via socket after `join_chat` — matching “wait / scroll / refresh” reports.

---

## E. Root-Cause Classification

```text
Notification tap     ✅ PASS
Tap routing          ✅ PASS
Conversation init    ✅ PASS
Local hydration      ⚠️  PARTIAL (cache often empty on cold notification open)
Remote fetch         ❌ FAIL (delta-only with stale metadata; partner skip)
Realtime subscription ✅ PASS (works after delay)
State update         ⚠️  PARTIAL (race clears isHydrating early)
UI rendering         ❌ FAIL (premature empty state)
```

---

## F. Fix Summary

| Change | File |
| :--- | :--- |
| Serialize `_hydrate()` — single in-flight future with coalesced reruns | `message_store.dart` |
| Full-sync fallback when cache empty but metadata `lastSequence > 0` | `conversation_sync_engine.dart` |
| Resolve partner from runtime metadata; retry hydrate when `resolvedUuid` arrives | `message_store.dart` |
| Prefetch active conversation + force hydrate **before** router push | `chat_notification_prefetch.dart`, `router.dart` |
| Keep loading spinner until `initialHydrationComplete` | `message_store.dart`, `chat_screen.dart` |

**Not modified:** BUG-C1a logout/session cleanup, BUG-G2/G2b/G2b-TAP/G3, BUG-E5, BUG-A7/A8/A10, notification routing for group join requests, `NotificationRealtimeBridge` chat skip.

---

## G. Automated Tests

| Suite | Result |
| :--- | :--- |
| `notification_chat_hydration_test.dart` | **5/5 PASS** |

---

## H. Manual QA

**VERIFIED PASS — QA SIGN-OFF COMPLETE** (2026-08-30). Scenarios A–F **PASS** on physical production APK. See `bug-c1b-fix-validation.md`.
