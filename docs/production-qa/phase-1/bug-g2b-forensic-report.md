# BUG-G2b Forensic Investigation Report

> **Bug ID:** `BUG-G2b`  
> **Module:** Groups / Notifications — Inbound Join Request Realtime Sync  
> **Platform:** Backend (Next.js) + Mobile (Flutter)  
> **Severity:** High (P1)  
> **Status:** FORENSIC AUDIT COMPLETE — ROOT CAUSE IDENTIFIED  
> **Related:** `BUG-G2` (mutation sync — VERIFIED PASS), `BUG-R4`, `BUG-N1a`

---

## 1. QA Symptom (Test G)

When Account B submits a join request to Account A's group:

| Channel | Expected | Actual |
| :--- | :--- | :--- |
| Push notification (FCM) | Delivered to Account A's mobile device | **Not delivered** |
| Join Requests sheet (`JoinRequestsSheet`) | Updates dynamically without manual refresh | **Does not update** |
| Mutation-side flows (Tests A–F) | N/A for this test | **PASS** (separate fix, do not regress) |

---

## 2. End-to-End Data-Flow Trace

```text
Account B (mobile or web)
       │
       ▼
POST /api/groups/:groupId/join-request          ← primary path (mobile + web GroupCard)
       │
       ▼
Supabase: group_memberships.status = pending_request   ✅ WRITES CORRECTLY
       │
       ├──► createNotification(GROUP_JOIN_REQUEST_RECEIVED)   ❌ NEVER CALLED
       │
       ├──► Socket emit (new_notification)                   ❌ NEVER EMITTED
       │
       └──► FCM push (PushService.sendPush)                   ❌ NEVER ATTEMPTED
       │
       ▼
Account A mobile
       │
       ├──► Socket listener → invalidate joinRequestsProvider   ❌ NO HANDLER
       ├──► FCM onMessage / onBackgroundMessage               ❌ NO PAYLOAD RECEIVED
       └──► JoinRequestsSheet (ref.watch joinRequestsProvider)  ⏸ STALE until manual refetch
```

### Alternate path (Explore interest — not used by QA Test G)

```text
POST /api/groups/interest
       │
       ├──► group_memberships pending_request   ✅
       └──► createNotification(...)              ✅ (creator only)
                 │
                 ├──► DB insert notifications   ✅
                 ├──► Socket new_notification    ❌ NOT IMPLEMENTED in createNotification
                 └──► FCM via PushService        ⚠ SUPPRESSED when admin is online (see §4)
```

Both mobile (`GroupService.sendJoinRequest`) and web (`GroupCard.handleRequestToJoin`) call **`POST /groups/:groupId/join-request`**, not `/api/groups/interest`.

---

## 3. Root Cause Analysis

### RC-1 — Backend: Join-request endpoint never creates a notification (PRIMARY)

**File:** `apps/web/src/app/api/groups/[groupId]/join-request/route.ts`

The POST handler inserts `pending_request` into `group_memberships` and returns success. It **never** calls `createNotification`.

By contrast, the legacy explore path at `apps/web/src/app/api/groups/interest/route.ts` (lines 114–148) **does** call `createNotification` with `NotificationType.GROUP_JOIN_REQUEST_RECEIVED` after creating the membership.

**Impact:** No DB notification row, no FCM dispatch, no downstream realtime signal for the standard join-request flow used in QA.

---

### RC-2 — Backend: No socket emit for non-chat notification types (SHARED INFRA GAP)

**Files:**
- `apps/web/src/lib/notifications/createNotification.ts`
- `apps/web/src/services/notifications/dispatcher.ts`
- `apps/web/src/services/socket/events.ts`

Socket `new_notification` is **only** emitted from `handleNotificationForUser()` in `events.ts` for **chat messages** (`NEW_MESSAGE`). There is no socket emit anywhere in the `createNotification` pipeline for:

- `GROUP_JOIN_REQUEST_RECEIVED`
- `MATCH_INTEREST_RECEIVED`
- `GROUP_INVITE_RECEIVED`
- Other non-chat types

**Impact:** Even if RC-1 is fixed, online recipients still receive **no realtime socket event**.

---

### RC-3 — Backend: FCM suppressed for online users under false assumption (SHARED INFRA GAP)

**File:** `apps/web/src/services/notifications/shouldSendPush.ts` (lines 72–76)

```typescript
// For match / request / system notifications: the socket layer already
// fired a `new_notification` event in real-time. Suppress FCM to avoid
// double-alerting ...
return false;
```

When the admin is **online** (socket connected), FCM for match/request/group notification types is **always suppressed**, assuming the socket already delivered `new_notification`. Because RC-2 means the socket **never fires** for join requests, online admins get **zero delivery** on both channels.

**Impact:** Explains Test G failure when Account A has the app open (foreground/online). Overlaps with **`BUG-R4`** (match requests / invitations) and partially with **`BUG-N1a`** (background delivery is a separate lifecycle issue).

---

### RC-4 — Mobile: No global inbound notification bridge (PRIMARY MOBILE GAP)

**Files:**
- `apps/mobile/lib/core/realtime/socket_service.dart` — registers `new_notification` on socket ✅
- `apps/mobile/lib/features/chat/providers/conversation_runtime_store.dart` — **only** consumer of `new_notification` ❌
- `apps/mobile/lib/features/groups/providers/group_details_provider.dart` — `joinRequestsProvider` only invalidated on **local mutations** ✅ (BUG-G2 fix; do not modify)

The `ConversationRuntimeStore._handleSocketEvent` handler for `new_notification` **requires** `chatId` or `groupId` in the payload (line 604–605). Chat-oriented `new_notification` payloads use `chatId`; a join-request notification would use `entity_type: group` / `entity_id: groupId` — **no handler exists** for that shape.

There is **no** mobile service that:
1. Listens to `new_notification` for non-chat types
2. Invalidates `joinRequestsProvider(groupId)`
3. Refreshes `notificationProvider` / `unreadCountProvider`
4. Refreshes `interestsProvider` / `invitationsProvider` (BUG-R4 overlap)

**Impact:** Even if backend socket emit were added, mobile would still not refresh `JoinRequestsSheet`.

---

### RC-5 — Mobile: FCM foreground path does not invalidate group providers (SECONDARY)

**File:** `apps/mobile/lib/core/services/fcm_service.dart`

FCM correctly registers channels including `kovari_groups`. Foreground messages emit to `FCMService.onNotificationEvent`, but `router.dart` **returns early** for `__foreground: true` events (no routing). Nothing in the app listens to foreground FCM events to invalidate `joinRequestsProvider` or refresh notifications.

**Impact:** Offline/background FCM delivery (when RC-1/RC-3 allow it) would show a system notification but still would not dynamically update an open `JoinRequestsSheet`.

---

## 4. JoinRequestsSheet Refresh Mechanism (Verified)

**File:** `apps/mobile/lib/features/groups/widgets/management_sheets.dart`

```dart
final requestsAsync = ref.watch(joinRequestsProvider(widget.group.id));
```

**File:** `apps/mobile/lib/features/groups/providers/group_details_provider.dart`

```dart
final joinRequestsProvider =
    FutureProvider.family<List<JoinRequestModel>, String>((ref, groupId) async {
      return service.getJoinRequests(groupId, ignoreCache: true);
    });
```

Rebuild triggers **only** when `joinRequestsProvider(groupId)` is invalidated or refetched. Confirmed invalidation paths today:

| Trigger | Invalidates `joinRequestsProvider`? |
| :--- | :--- |
| Local `approveRequest` / `rejectRequest` (BUG-G2 fix) | ✅ Yes |
| Remote join request via socket/FCM | ❌ No |
| Pull-to-refresh on group screen | ❌ No dedicated hook |
| Manual navigation away and back | ✅ Yes (provider re-built on re-open) |

The missing passive path is exactly:

```text
remote pending_request event
       ↓
invalidate(joinRequestsProvider(groupId))   ← NOT WIRED
       ↓
getJoinRequests(..., ignoreCache: true)
       ↓
JoinRequestsSheet rebuild
```

---

## 5. Overlap with BUG-R4 and BUG-N1a

| Defect | Shared root | Distinct symptom |
| :--- | :--- | :--- |
| **BUG-G2b** | RC-2, RC-3, RC-4 | Group admin Join Requests sheet + join-request push |
| **BUG-R4** | RC-2, RC-3, RC-4 | Home `/requests` screen (interests + invitations) |
| **BUG-N1a** | FCM Android lifecycle | Background/killed delivery timing (separate from online suppression) |

Fixing RC-2 + RC-4 as **shared notification realtime infrastructure** will likely resolve significant BUG-R4 surface area. RC-1 is **G2b-specific**. RC-3 requires revisiting the online-suppression policy once socket emit exists.

---

## 6. Minimal Fix Recommendation

> **Rule:** Do **not** modify `group_details_provider.dart` mutation paths (Tests A–F verified PASS).

### Backend (smallest G2b unblock)

1. **`join-request/route.ts` POST** — After successful `pending_request` insert (both new insert and declined→pending update paths), call `createNotification`:
   - `type: GROUP_JOIN_REQUEST_RECEIVED`
   - `userId: group.creator_id` (and any group admins if product requires)
   - `entityType: "group"`, `entityId: groupId`
   - Include requester name in `message`

2. **`createNotification.ts` (or new `emitRealtimeNotification` helper)** — After DB insert, emit socket event to `user_socket:{clerkId}`:

   ```typescript
   io.to(`user_socket:${clerkId}`).emit("new_notification", {
     id: notificationId,
     type,
     title,
     message,
     entity_type: entityType,
     entity_id: entityId,
     created_at: new Date().toISOString(),
   });
   ```

3. **`shouldSendPush.ts`** — Revisit lines 72–76: either emit socket first then suppress FCM, or allow FCM for `GROUP_JOIN_REQUEST_RECEIVED` when socket emit is confirmed. Do not suppress both channels.

### Mobile (receiver-side bridge — new file, not group_details_provider)

4. **New `NotificationRealtimeBridge`** (or extend `runtime_init.dart` wiring):
   - Subscribe to `socketServiceProvider.notifier.events` where `type == 'new_notification'`
   - Subscribe to `FCMService.onNotificationEvent` for foreground refresh
   - On `GROUP_JOIN_REQUEST_RECEIVED` + `entity_id`:
     - `ref.invalidate(joinRequestsProvider(groupId))`
     - `ref.read(notificationProvider.notifier).refresh(ignoreCache: true)`
     - `ref.invalidate(unreadCountProvider)`
   - On `MATCH_INTEREST_RECEIVED` / `GROUP_INVITE_RECEIVED`: invalidate `interestsProvider` / `invitationsProvider` (BUG-R4)

---

## 7. Files Inspected (Forensic Scope)

| Layer | File | Finding |
| :--- | :--- | :--- |
| Backend API | `apps/web/src/app/api/groups/[groupId]/join-request/route.ts` | No notification creation |
| Backend API | `apps/web/src/app/api/groups/interest/route.ts` | Has notification (unused by QA path) |
| Backend notify | `apps/web/src/lib/notifications/createNotification.ts` | DB + FCM only; no socket |
| Backend push | `apps/web/src/services/notifications/shouldSendPush.ts` | Online suppression without socket |
| Backend socket | `apps/web/src/services/socket/events.ts` | Chat-only `new_notification` |
| Mobile socket | `apps/mobile/lib/core/realtime/socket_service.dart` | Registers listener; no group handler |
| Mobile handler | `conversation_runtime_store.dart` | Chat-only `new_notification` consumer |
| Mobile UI | `management_sheets.dart` | Watches `joinRequestsProvider` |
| Mobile FCM | `fcm_service.dart` | No provider invalidation on receive |

---

## 8. Verification Strategy (Post-Fix)

### Test G — Inbound Join Request (receiver)

1. Account A (admin) opens group on mobile; keep `JoinRequestsSheet` open or group settings visible.
2. Account B submits join request (mobile or web).
3. **Expected:** Push notification on A's device; Join Requests list updates within 1–2 s without navigation.

### Regression — Tests A–F

Re-run full BUG-G2 mutation protocol. **Must remain PASS.** No changes to `GroupActionsNotifier` invalidation logic.

### Shared infra — BUG-R4 spot check

1. Account B sends solo match interest to Account A.
2. **Expected:** Account A's Requests screen updates dynamically (same bridge).

---

## 9. Engineering Task Summary

| Priority | Task | Owner scope |
| :--- | :--- | :--- |
| P1 | Add `createNotification` to `join-request` POST | Backend |
| P1 | Emit socket `new_notification` from notification pipeline | Backend / Socket |
| P1 | Fix online-only FCM suppression false negative | Backend |
| P1 | Add mobile `NotificationRealtimeBridge` (socket + FCM → provider invalidation) | Mobile |
| P2 | BUG-R4 full validation after shared bridge | QA |
| — | **Do not touch** `group_details_provider.dart` mutation paths | — |
