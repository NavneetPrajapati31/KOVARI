# BUG-C4b Forensic Fix-Safety Audit (Test D & Test E)

This document provides a detailed forensic analysis of the recent human QA failures observed in **Test D (15s outbox timeout)** and **Test E (group read ticks reverting to grey)**, along with a minimal-risk implementation plan.

---

## 1. Executive Summary
During Phase 1 human QA of the BUG-C4b outbox recovery logic, Tests A, B, C, and F passed successfully, confirming client-side replay safety and backend insert idempotency. However:
1. **Test D Failed:** The 15-second timeout fires, but the message status never transitions to "Failed" in the UI.
2. **Test E Failed:** Group message read ticks revert from white (seen) to grey (delivered) after a reload or reconnect.

This audit validates the root causes and proposes a targeted, backward-compatible, and production-safe implementation plan to resolve both failures without introducing regressions.

---

## 2. Test D Forensic Validation

### Message Send & Timeout Lifecycle Trace
1. **Send Initiation:** `ChatMutationService.sendMessage` is called, generating a `clientMessageId` (UUID).
2. **Optimistic Insert:** An optimistic message with ID `pending_$clientMessageId` and status `MessageDeliveryStatus.pending` is added to `MessageStore`.
3. **Journaling:** The payload is persisted in `MutationJournal` as `MutationStatus.pending`.
4. **Socket Emit:** `_emit` transitions the journal status to `MutationStatus.sending` and starts a 15-second timer.
5. **Timeout Trigger:** If no ACK is received within 15 seconds, the timer fires, calling `_markFailed(chatId, clientMessageId)`.
6. **Failure State Transition:** `_markFailed` updates the journal status to `MutationStatus.failure` and calls `MessageStore.updateDeliveryStatus('pending_$clientMessageId', MessageDeliveryStatus.failed)`.

### Why the Failed Transition is Rejected
In [`message_store.dart:748-758`](file:///c:/Users/navne/CSE/DEV/KOVARI/apps/mobile/lib/features/chat/providers/message_store.dart#L748-L758):
```dart
void updateDeliveryStatus(String messageId, MessageDeliveryStatus status) {
  final msg = state.messages[messageId];
  if (msg == null) return;
  if (status.statePriority <= msg.deliveryStatus.statePriority) return; // Guard
  ...
}
```
* `failed` has a `statePriority` of `0` ([`message_entity.dart:15`](file:///c:/Users/navne/CSE/DEV/KOVARI/apps/mobile/lib/features/chat/models/message_entity.dart#L15)).
* The in-flight optimistic message is in `pending` status, which has a `statePriority` of `1`.
* The priority guard checks: `status.statePriority <= msg.deliveryStatus.statePriority` $\rightarrow$ `0 <= 1` which is **true**.
* The function returns immediately, dropping the failure transition.

### Dependency and Impact Analysis
* **State priority dependencies:** `markSeenByMessageIds` and `markSeenUpTo` rely on `statePriority` to ensure message status only progresses forward (e.g. `delivered -> seen` but never `seen -> delivered`).
* **Terminal status:** `failed` is intended as a terminal error state (`failed.isFinal` is `true`).
* **Retry behavior:** `ChatMutationService.retryMessage` loads the failed payload, resets the state to `pending`, and re-emits. It expects `failed` to be set to render the retry UI.
* **Safety:** Altering the guard specifically to allow `failed` status will not permit invalid transitions like `seen -> delivered` because `seen` is already terminal and `failed` is only reachable from in-flight states.

---

## 3. Test D Safe Fix Design

The safest, most minimal fix is to exempt `failed` from the monotonic priority guard in `MessageStore.updateDeliveryStatus`:

```diff
 void updateDeliveryStatus(String messageId, MessageDeliveryStatus status) {
   final msg = state.messages[messageId];
   if (msg == null) return;
-  if (status.statePriority <= msg.deliveryStatus.statePriority) return;
+  if (status != MessageDeliveryStatus.failed &&
+      status.statePriority <= msg.deliveryStatus.statePriority) return;
 
   final updatedEntity = msg.copyWith(deliveryStatus: status);
```

### Invariant Verification
* `seen -> delivered` is blocked (`2 <= 4` is true).
* `seen -> pending` is blocked (`1 <= 4` is true).
* `delivered -> pending` is blocked (`1 <= 3` is true).
* `pending/sending/delivered -> failed` is **allowed** (since `status == failed` bypasses the check).
* `failed -> pending` is **allowed** via `retryMessage` because it resets the status explicitly.

---

## 4. Test E Database & Schema Analysis

We inspected the Supabase database migrations (`supabase/migrations/*`).
* **`group_messages` table does NOT contain a `read_at` column.**
* `read_at` only exists on the `direct_messages` table (where it maps the 1-to-1 read timestamp).
* There is no existing `group_message_reads` or `group_message_seen` table.
* **Conclusion:** Storing group seen status inside a new `read_at` column on `group_messages` is not possible without a database schema migration. Because modifying the production DB schema is a high-risk operation, we must solve this without altering the schema.

---

## 5. Group Read Receipt Architecture

### Realtime Seen Flow
1. **Action:** Mobile user opens a group chat, triggering `markSeenUpTo(chatId, lastSeenSequence)`.
2. **Socket Emit:** Emit `mark_seen` to socket server carrying `chatId` and `lastSeenSequence`.
3. **Redis Tracking:**
   * Backend retrieves all message IDs in the group up to `lastSeenSequence`.
   * For each message, it adds the user to a Redis Set: `group_msg_seen:${chatId}:${msgId}`.
   * Key TTL is set to **1 hour (3600s)** once the message is fully seen.
4. **Seen Evaluation:**
   * Backend counts members in the set using `sCard(setKey)`.
   * If `seenCount >= memberCount - 1`, the message is fully seen.
5. **Broadcast:** Broadcast `messages_seen` with `isFullySeen: true` to the socket room.
6. **Mobile UI:** The tick turns white (seen) and updates the local cache.

### Why Ticks Revert to Grey on Reload
When the API fetches group messages (`GET /api/groups/[groupId]/messages`):
* It performs a Redis `sCard` check for each message (line 126 in `route.ts`).
* **Redis Key Expiry/Restart:** Once the 1-hour TTL expires or Redis flushes, the set is gone. `sCard` returns `0`.
* **API Response:** The API returns `deliveryStatus: "delivered"` instead of `"seen"`.
* **Mobile Overwrite:** On reload, the mobile app performs `syncDelta` and merges the API response, downgrading the local seen state back to grey.

---

## 6. Test E Safe Fix Design

Since we cannot modify the database schema, we must resolve this by **extending the Redis key TTL** and **preventing the mobile app from downgrading locally verified seen states**.

### Layer 1 — Extend Redis TTL
Increase the Redis seen set expiration from 1 hour to 14 days (or make it persistent for active messages). Since these keys only contain user IDs, memory usage is negligible.
Modify `apps/web/src/services/socket/events.ts`:
```typescript
// Keep the seen set alive for 14 days (1209600 seconds)
await pubClient.expire(setKey, 1209600);
```

### Layer 2 — Mobile Hydration Safeguard (Monotonic Merge)
When the mobile client merges messages from the REST API, it must never downgrade a locally verified status from `seen` to `delivered`.
In [`message_store.dart:597`](file:///c:/Users/navne/CSE/DEV/KOVARI/apps/mobile/lib/features/chat/providers/message_store.dart#L597), we already have a `_maxDeliveryStatus` utility. We must apply this safety floor during the delta sync cache updates.

In [`message_store.dart:370-388`](file:///c:/Users/navne/CSE/DEV/KOVARI/apps/mobile/lib/features/chat/providers/message_store.dart#L370-L388):
```dart
      final List<MessageEntity> freshEntities = freshMsgs
          .where((m) => m.conversationId == _chatId)
          .map((m) {
            // Retrieve existing status from memory/cache before applying REST update
            final existing = state.messages[m.id];
            final incomingStatus = MessageDeliveryStatus.values.firstWhere(
              (e) => e.name == m.status,
              orElse: () => MessageDeliveryStatus.sent,
            );
            final resolvedStatus = existing != null
                ? _maxDeliveryStatus(existing.deliveryStatus, incomingStatus)
                : incomingStatus;

            return MessageEntity(
              id: m.id,
              chatId: _chatId,
              senderId: m.senderId,
              createdAt: m.createdAt,
              text: m.text,
              mediaUrl: m.mediaUrl,
              mediaType: m.mediaType,
              deliveryStatus: resolvedStatus,
              conversationSequence: m.sequence,
            );
          })
          .toList();
```

---

## 7. Web Regression & Safety Impact
* **Web UI Impact:** None. The web app uses the same API endpoints and socket events, so extending Redis TTL will automatically prevent the web app ticks from reverting to grey as well.
* **Performance Impact:** Redis memory usage will slightly increase but remains extremely low (a set with a few UUIDs takes less than 1KB).
* **Direct Messages:** Unaffected. DMs rely on SQL `direct_messages.read_at` which is fully durable.

---

## 8. Test Plan

### Test D Verification
1. Disconnect network on mobile.
2. Send a message.
3. Wait 15 seconds.
4. Verify red **Failed** indicator appears on the message.
5. Restore network, tap **Retry**, and confirm message is delivered successfully.

### Test E Verification
1. Mark a group message as seen by all members on mobile.
2. Verify ticks turn white.
3. Flush Redis keys (in test environment) or wait for TTL.
4. Reload the conversation / force-restart the app.
5. Verify ticks **remain white** on mobile.

---

## 9. Final Recommendations

### Promotion Decision

* **TEST D:** **IMPLEMENT** (Safe, targeted mobile-only fix)
* **TEST E:** **IMPLEMENT** (Combined backend Redis TTL extension + mobile monotonic hydration safeguard)

* **OVERALL STATUS:** **SAFE TO IMPLEMENT**
