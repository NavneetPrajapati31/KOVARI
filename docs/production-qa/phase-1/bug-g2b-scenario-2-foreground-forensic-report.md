# BUG-G2b Scenario 2 Forensic Report — Foreground Notification Failure

> **Status:** FORENSIC COMPLETE — NO APPLICATION SOURCE CODE MODIFIED  
> **Date:** 2026-08-29  
> **Scope:** Test G Scenario 2 only (Account A foreground elsewhere in app)

---

## 1. Investigation Scope

**Question:** Why does `GROUP_JOIN_REQUEST_RECEIVED` produce **no visible notification/alert** when Account A is actively using the foreground mobile app somewhere other than the Join Requests screen?

**In scope:** Foreground delivery path differences between Scenario 1 (Join Requests open — PASS) and Scenario 2 (elsewhere — FAIL).

**Out of scope:** G2 mutation logic, chat messaging, background/cold-start FCM (Scenarios 3–4 PASS), notification tap routing (separate follow-up), BUG-R4, full BUG-N1a lifecycle.

---

## 2. Current Production Evidence

Post-RC-4 Test G (2026-08-29, backend `b8be0510`, operator Navneet):

| Scenario | Result | Relevance |
| :--- | :--- | :--- |
| **1** — Foreground, Join Requests open | **PASS** | Proves socket → bridge → `joinRequestsProvider` invalidation works |
| **2** — Foreground, elsewhere | **FAIL** — no notification | **Subject of this report** |
| **3** — Background | **PASS** | FCM delivers when socket disconnected (BackgroundGovernor) |
| **4** — Cold start / tap | **PASS** | FCM delivers when app terminated |
| **5** — G2 regression | **PASS** | Mutation paths untouched |
| **6** — Chat regression | **PASS** | Chat local-notification path intact |

**BUG-G2b status after QA:** `OPEN — PARTIAL PASS` (Scenario 2 blocks sign-off).

No logcat capture was available in the forensic environment. Conclusions below distinguish **code-proven** vs **runtime-inferred** vs **unknown**.

---

## 3. Complete Notification Delivery Trace

```text
Account B
  → POST /groups/[groupId]/join-request
  → notifyGroupJoinRequestRecipients()
  → createNotification()
  → notifications DB insert                          [runtime: proven in S1/S3]
  → after()
      → emitRealtimeNotification(clerkId + supabaseId)
      → Redis NOTIFICATION_SOCKET_CHANNEL
      → Render socket subscriber
      → io.to(user_socket:{clerkId})
      → io.to(user_socket:{supabaseUuid})
      → mobile socket "new_notification"
      → NotificationRealtimeBridge._onSocketEvent
      → dispatchInboundNotification()
      → refreshNotifications + invalidateJoinRequests
  → evaluatePushNotifications()
      → shouldSendPush(GROUP_JOIN_REQUEST_RECEIVED)
      → hasDeliverableRealtimeSocket(supabaseId room occupied)
      → FCM SUPPRESSED (mobile foreground + connected socket)
```

**Scenario 2 stop point (visible alert):** After bridge silent provider refresh — **no mobile UI renders a foreground notification.**

---

## 4. Scenario 1 vs Scenario 2 Comparison

| Step | Scenario 1 (PASS) | Scenario 2 (FAIL) | Same code path? |
| :--- | :--- | :--- | :--- |
| Mobile app lifecycle | Foreground | Foreground | Yes |
| Socket connected | Yes (not backgrounded) | Yes | Yes |
| `user_socket:{uuid}` occupied | Yes | Yes | Yes |
| FCM sent by backend | **No** (suppressed) | **No** (suppressed) | Yes |
| Socket `new_notification` received | **Inferred yes** (S1 sync works) | **Inferred yes** (same state) | Yes |
| `NotificationRealtimeBridge` processes event | **Inferred yes** | **Inferred yes** | Yes |
| `joinRequestsProvider` invalidated | Yes (sheet rebuilds) | Yes (code always runs) | Yes |
| `notificationProvider` refreshed | Yes | Yes | Yes |
| `unreadCountProvider` invalidated | Yes | Yes (but UI scope limited) | Yes |
| **Visible foreground alert** | **Yes** — user sees Join Requests list update on-screen | **No** — user not on Join Requests; no tray/banner | **Different UX surface** |
| `FCMService.showLocalNotification` | **Not called** (bridge) | **Not called** | Yes |
| `FirebaseMessaging.onMessage` | **Not fired** (FCM suppressed) | **Not fired** | Yes |

**Mandatory comparison conclusion:** Scenario 1 and Scenario 2 share the **same backend and socket/bridge code path**. The failure is **not** evidence that the bridge is broken globally. The observable difference is **what UI the user is looking at** and **absence of a global foreground alert mechanism** for non-chat notifications.

---

## 5. Socket Analysis

### A. Does the socket event reach the mobile device in Scenario 2?

| Classification | Answer |
| :--- | :--- |
| **Runtime-proven** | Not directly (no logcat in this investigation) |
| **Strong inference** | **Yes** — Scenario 1 PASS under identical foreground + connected-socket conditions requires the same socket delivery path |

**Handler chain (code-proven):**

1. `apps/mobile/lib/core/notifications/notification_realtime_bridge.dart` — `_onSocketEvent` → `_processPayload(source: 'socket')`
2. `apps/mobile/lib/core/notifications/inbound_notification_event.dart` — `dispatchInboundNotification` adds `refreshNotifications` + `invalidateJoinRequests` for `GROUP_JOIN_REQUEST_RECEIVED`

Socket delivery is **not** the first failed stage for Scenario 2's visible-notification symptom.

---

## 6. FCM Analysis

### B. Is FCM sent or intentionally suppressed?

**Code-proven: intentionally suppressed** when mobile UUID socket room is occupied.

```142:149:apps/web/src/services/notifications/shouldSendPush.ts
  if (supabaseId) {
    const mobileSocketCount = await pubClient.sCard(`user_socket:${supabaseId}`);
    if (mobileSocketCount > 0) return true;
    // Dual-identity user with mobile offline: web may be online on the Clerk
    // room, but FCM must still reach the device — do not suppress here.
    return false;
  }
```

`GROUP_JOIN_REQUEST_RECEIVED` ∈ `REALTIME_SOCKET_DELIVERED_TYPES` → `shouldSendPush` returns `false` → `evaluatePushNotifications` exits before `PushService.sendPush` → `push_status` likely **`suppressed`** on the notification row.

**Why Scenarios 3–4 still get FCM:** `BackgroundGovernor` disconnects the socket when backgrounded (`apps/mobile/lib/core/runtime/background_governor.dart` lines 40–45), clearing UUID room occupancy → backend sends FCM.

| State | UUID socket room | FCM for join request |
| :--- | :--- | :--- |
| Foreground (S1, S2) | Occupied | **Suppressed** |
| Background (S3) | Empty (disconnected) | **Sent** |
| Cold start (S4) | Empty | **Sent** |

FCM suppression in Scenario 2 is **by design (RC-3/RC-4)**, not a bug in isolation. The gap is **missing compensating foreground UI** on the socket path.

---

## 7. Foreground Notification / UI Analysis

### C. If socket delivery succeeds, why is there no visible foreground notification?

**Code-proven root mechanism:**

#### 7.1 `NotificationRealtimeBridge` is silent-only

The bridge performs provider invalidation only. It **never** calls `FCMService.showLocalNotification()` or any in-app banner.

```127:156:apps/mobile/lib/core/notifications/notification_realtime_bridge.dart
  void _applyAction(...) {
    switch (action) {
      case NotificationRealtimeAction.refreshNotifications:
        _refreshNotificationState();
      case NotificationRealtimeAction.invalidateJoinRequests:
        ref.invalidate(joinRequestsProvider(groupId));
      ...
    }
  }
```

#### 7.2 Chat (`NEW_MESSAGE`) uses a different pattern — visible local notification on socket

```681:685:apps/mobile/lib/features/chat/providers/conversation_runtime_store.dart
          FCMService.instance.showLocalNotification(
            title: senderName,
            body: bodyMessage,
            data: {'entity_type': 'chat', 'entity_id': chatId},
          );
```

`GROUP_JOIN_REQUEST_RECEIVED` has **no equivalent** call on the socket path.

#### 7.3 FCM foreground display path is unreachable in Scenario 2

`FCMService._handleForegroundMessage` shows `flutter_local_notifications` and emits to the bridge stream — but it only runs when FCM is delivered. FCM is suppressed (§6).

```325:360:apps/mobile/lib/core/services/fcm_service.dart
  void _handleForegroundMessage(RemoteMessage message) {
    ...
    _localNotifications.show(...);
    _tapBroadcast.emit({...message.data, '__foreground': true, ...});
  }
```

#### 7.4 Router explicitly skips foreground routing (by design)

```84:87:apps/mobile/lib/core/navigation/router.dart
    final isForeground = data['__foreground'] == true;
    if (isForeground) return;
```

Even if FCM fired, navigation would not occur — only local notification display would.

#### 7.5 Bell badge is Home-scoped, not global

`unreadCountProvider` is watched only in `HomeHeader` (`home_screen.dart`) and `notifications_screen.dart`. If Account A is on Groups/Explore/Chat tab, **invalidating unread count does not surface a visible badge** on that screen.

#### 7.6 No in-app banner for non-chat types (BUG-N1b overlap)

No global foreground banner component exists for `GROUP_JOIN_REQUEST_RECEIVED`. Documented separately as BUG-N1b.

### Why Scenario 1 passes

Account A watches `joinRequestsProvider` directly on `JoinRequestsSheet`:

```217:218:apps/mobile/lib/features/groups/widgets/management_sheets.dart
    final requestsAsync = ref.watch(joinRequestsProvider(widget.group.id));
```

Invalidation causes **immediate on-screen list update** — this satisfies Scenario 1's "notification state" without any system tray or global alert.

### Why Scenario 2 fails

Account A is **not** watching `joinRequestsProvider` on-screen. Silent provider refresh does not produce a user-visible alert. FCM (the only path that would call `_localNotifications.show` for this type) is suppressed. **No compensating `showLocalNotification` exists on the socket path.**

---

## 8. First Failed Stage & Root Cause

```text
FIRST FAILED STAGE:
Mobile foreground visible notification presentation for GROUP_JOIN_REQUEST_RECEIVED
(after successful socket delivery and NotificationRealtimeBridge silent provider refresh)

VERIFIED ROOT CAUSE:
Architectural gap: RC-3/RC-4 suppresses FCM while the mobile UUID socket room is
occupied (foreground app), but NotificationRealtimeBridge only invalidates providers
and does not show a foreground alert. Unlike NEW_MESSAGE (ConversationRuntimeStore
calls FCMService.showLocalNotification on socket receive), join-request socket events
are intentionally silent. Scenario 1 "passes" because JoinRequestsSheet IS the
visible feedback surface; Scenario 2 has no equivalent global alert.

EVIDENCE:
- shouldSendPush.ts: UUID room occupied → suppress FCM for REALTIME_SOCKET_DELIVERED_TYPES
- notification_realtime_bridge.dart: no showLocalNotification / no banner
- conversation_runtime_store.dart: chat DOES call showLocalNotification on socket path
- fcm_service.dart: foreground tray only via onMessage (FCM), not bridge
- home_header.dart: bell badge only on Home tab
- Post-RC-4 QA: S1 PASS, S2 FAIL, S3–S4 PASS (consistent with FCM-off/socket-on foreground model)

WHY SCENARIO 1 PASSES:
User is on JoinRequestsSheet watching joinRequestsProvider; bridge invalidation
rebuilds the visible list — direct on-screen feedback without system notification.

WHY SCENARIO 2 FAILS:
User is elsewhere; same silent bridge path runs but no JoinRequestsSheet is visible,
FCM is suppressed, and no showLocalNotification/banner is invoked for group join requests.
```

| Claim | Classification |
| :--- | :--- |
| FCM suppressed when foreground + socket connected | **Code-proven** |
| Bridge does not show foreground alert | **Code-proven** |
| Chat shows local notification on socket; join request does not | **Code-proven** |
| Socket event received in Scenario 2 | **Runtime-inferred** (from S1 parity) |
| `push_status = suppressed` on notification row | **Runtime-inferred** (not captured) |
| Join list fresh on navigation in S2 | **Unknown** (operator reported notification fail only) |

---

## 9. Affected Files

| File | Role |
| :--- | :--- |
| `apps/web/src/services/notifications/shouldSendPush.ts` | Suppresses FCM when UUID socket room occupied |
| `apps/web/src/lib/notifications/createNotification.ts` | Skips FCM dispatch when `shouldSendPush` false |
| `apps/mobile/lib/core/notifications/notification_realtime_bridge.dart` | Silent provider refresh only — **primary fix target** |
| `apps/mobile/lib/core/notifications/inbound_notification_event.dart` | Does not surface title/message to bridge actions |
| `apps/mobile/lib/core/services/fcm_service.dart` | `showLocalNotification` exists but not invoked by bridge |
| `apps/mobile/lib/features/chat/providers/conversation_runtime_store.dart` | Reference pattern for socket-triggered local notification |
| `apps/mobile/lib/features/home/widgets/header/home_header.dart` | Bell badge limited to Home screen |
| `apps/mobile/lib/core/navigation/router.dart` | Foreground FCM events not routed (intentional) |

**Not affected / do not modify for Scenario 2 fix:** `group_details_provider.dart`, backend join-request route, socket server dual-room fan-out, chat paths.

---

## 10. Recommended Minimal Fix (NOT IMPLEMENTED)

**Mirror the chat socket pattern for `GROUP_JOIN_REQUEST_RECEIVED` only.**

After `NotificationRealtimeBridge` successfully processes a join-request event via **socket** (or optionally FCM foreground stream), call:

```dart
FCMService.instance.showLocalNotification(
  title: payload['title'] ?? 'Join Request',
  body: payload['message'] ?? 'Someone wants to join your group',
  data: {
    'type': 'GROUP_JOIN_REQUEST_RECEIVED',
    'entity_type': 'group',
    'entity_id': groupId,
    'notificationId': payload['id'],
  },
);
```

**Implementation notes:**

1. Pass `title` / `message` from raw socket payload (already emitted by backend `RealtimeNotificationSocketPayload`).
2. Reuse existing `kovari_groups` channel via `_channelIdForEntityType('group')`.
3. Optional refinement: suppress local notification if Join Requests sheet for that `groupId` is currently visible (avoid duplicate with S1) — not required for minimal fix.
4. **Do not** change `shouldSendPush` suppression policy — background/cold-start FCM already works.
5. **Do not** change router tap routing in this task (separate tap-routing follow-up for Scenarios 3–4).

**Estimated scope:** ~15–30 lines in `notification_realtime_bridge.dart` + parse title/message in bridge or `InboundNotificationEvent` + 1–2 unit tests.

---

## 11. Regression Risks

| Area | Risk | Mitigation |
| :--- | :--- | :--- |
| Scenario 1 (Join Requests open) | Low — may show redundant tray notification alongside list update | Optional sheet-visible guard |
| Scenario 3–4 (background FCM) | None if fix is socket-path-only local notification | Do not alter FCM suppression |
| Scenario 5 (G2 mutations) | None — bridge does not touch mutation providers | No `group_details_provider.dart` changes |
| Scenario 6 (chat) | None — chat uses `ConversationRuntimeStore` | Do not modify chat handler |
| Duplicate notifications | Low — existing 15s dedupe in `FCMService._shouldShowNotification` | Uses `entity_id` as dedupe key |
| BUG-N1b | Partial overlap — adds system tray, not custom in-app banner | Acceptable for Scenario 2 sign-off |

---

## 12. Verification Plan (Post-Fix)

1. **Scenario 2 re-run:** Account A on Home or Groups tab (not Join Requests) → Account B submits request → **system notification appears** within ~2s.
2. **Scenario 1 regression:** Join Requests sheet open → list still updates dynamically; duplicate tray acceptable or guarded.
3. **Scenario 3–4 regression:** Background/cold-start push unchanged.
4. **Scenario 5–6 regression:** G2 + chat unchanged.
5. **Logcat:** `[NotificationRealtimeBridge] Processing GROUP_JOIN_REQUEST_RECEIVED via socket` + FCM local show log.
6. **Optional DB check:** `push_status = suppressed` still expected on foreground attempts — fix is client-side compensating UI.

---

## 13. Next Task

Implement **only** the verified Scenario 2 minimal fix (socket-path `showLocalNotification` for join requests).

Handle **notification tap routing to Join Requests sheet** as a **separate follow-up task** (Scenarios 3–4 UX defect).

Do **not** mark BUG-G2b VERIFIED PASS until Scenario 2 passes after fix deployment.

---

## 14. Implementation Status (Scenario 2 Fix)

> **Implemented:** 2026-08-29 — production manual QA **pending**

| Item | Status |
| :--- | :--- |
| Forensic report recommendation | Implemented |
| `shouldSendPush` / backend | **Not modified** |
| Tap routing (Scenarios 3–4) | **Not modified** |
| Socket-path local notification | **Added** in `notification_realtime_bridge.dart` |
| Automated tests | **18/18 PASS** (`notification_realtime_bridge_test.dart`) |
| Manual Scenario 2 QA | **PASS** (2026-08-29 ~11:25 IST) |

**Next step:** Tap routing follow-up for Scenarios 3–4 (separate task) if product requires Join Requests sheet deep-link.
