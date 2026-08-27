# BUG-C4b Forensic Investigation Report
## Intermittent Realtime Chat Message Delivery Failures

### 1. Bug Summary
* **Bug ID:** `BUG-C4b`
* **Title:** Intermittent Realtime Chat Message Delivery Failures
* **Module:** Chat / Realtime
* **Platform:** Mobile (Production Android APK)
* **Severity:** High
* **Status:** Under Investigation (Forensic Phase Completed)

---

### 2. Original Reproduction
Manual production testing revealed that message sending and receiving is non-deterministic:
* Sometimes messages fail to deliver or update in the UI when online.
* Outgoing messages composed while offline are silently dropped upon network restoration (`BUG-C4a`).
* Inbox badge counts and conversation preview snippets do not consistently update or sync correctly when the app is launched from a closed state (`BUG-R3`).

---

### 3. Exact Message Lifecycle Trace
Below is the trace of a message sent from the mobile client:

1. **User Action:** User types a message and taps Send.
2. **Chat Mutation Service (`ChatMutationService.sendMessage`):**
   * Generates a unique `clientMessageId` (UUID).
   * Inserts an optimistic message (`MessageEntity.optimistic`) into the `MessageStore`.
   * Records a pending mutation entry in the `MutationJournal` via Hive.
3. **Emit or Defer Decision:**
   * If the socket state is `connected`, it attempts to emit the message immediately via `_emit()`.
   * If the socket is offline, it leaves it as `pending` in the journal for future replay on reconnection.
4. **Emit Execution (`_emit`):**
   * Updates the journal entry status to `MutationStatus.sending` to prevent replay collisions.
   * Calls `realtimeCoordinatorProvider.notifier.sendMessage()`.
5. **Socket Client Event (`SocketService.emit`):**
   * Verifies connection state via `_socket.connected`.
   * **Failure Point 1 (Race/Stuck State):** If the socket connection drops or is transiently disconnected at the library level while Riverpod state is still transitioning, `emit` warns and returns early *without* executing the acknowledgment callback.
   * **Failure Point 2 (Dropped ACK Callback):** If the socket emits the event but connection drops before the server's acknowledgement callback is received, the ACK callback is lost forever.
   * In both failure cases, the journal entry remains permanently stuck in `MutationStatus.sending`, preventing it from ever being replayed on reconnection.
6. **Socket Server Processing (`apps/web/src/services/socket/events.ts`):**
   * Authenticates user via Clerk/JWT token.
   * Validates safety constraints (banned/blocked checks).
   * Persists message to Supabase (`direct_messages` or `group_messages`), generating sequence numbers.
   * Enriches message with metadata.
   * Broadcasts message to room (`receive_message`) and emits `message_persisted` ACK.
7. **Receiver Processing (`MessageStore._onReceiveMessage`):**
   * Receives `receive_message` payload.
   * **Failure Point 3 (Cache Write Hazard):** Spawns an unawaited async background call to `syncEngine.processRealtimeMessage()`. If messages arrive in quick succession, concurrent read-modify-write transactions on the Hive/local database result in data loss and index corruption.
   * Reconciles matching optimistic messages or inserts new message.
   * Emits `message_delivered` confirmation to server.

---

### 4. Code Audit & Inspection
#### A. Mobile Socket Client (`SocketService` & `ChatMutationService`)
* **State Drift:** Riverpod's `SocketState` and the underlying socket.io-client connection status can drift. Messages emitted during this drift window fail silently because `SocketService.emit` returns early without running the ACK callback.
* **Mutation Journal Stuck State:** Once a message is marked as `MutationStatus.sending`, it is permanently skipped by `replayPendingMessages()` on reconnection. This causes messages to remain in a perpetual "sending/pending" state in the UI.
* **Silent Outbox Dropping:** Outgoing messages composed while offline are marked as `MutationStatus.pending`. If a connection attempt is made but immediately interrupted, they transition to `MutationStatus.sending` and get stuck there.

#### B. Message Store (`MessageStore` & Cache Sync Engine)
* **Concurrency Data Loss:** The change from `await syncEngine.processRealtimeMessage(...)` to `unawaited(syncEngine.processRealtimeMessage(...))` introduced concurrent database accesses. Because local message cache reads are merged in memory and then written back (`ConversationConflictResolver.merge`), concurrent calls overwrite each other, causing message loss from local cache.
* **History Cache Corruption:** Similarly, `_persistMessageToHistoryCache` is unawaited, making it susceptible to the same read-modify-write race conditions.

#### C. Web Client & Shared Backend API
* The Next.js API endpoints and Node.js Socket.IO server execute message persistence sequentially per socket connection and return sequences properly.
* Web client uses standard Socket.IO ACK handling and does not rely on a persistent mutation journal, meaning web users are unaffected by the mobile mutation replay bugs.

---

### 5. Root Cause Classification
* **Primary Category:** **A. Mobile client bug** & **G. Race condition**
* **Root Cause Verification:**
  1. **Outbox Replay Block:** Stuck `MutationStatus.sending` states in the `MutationJournal` prevent message replays on reconnection.
  2. **Cache Merging Race Condition:** Unawaited concurrent read-modify-write cache writes in the `MessageStore` cause messages to overwrite each other, resulting in message and state loss.

---

### 6. Proposed Fixes
#### Fix 1: Reset Stuck Sending Statuses on Replay
In `ChatMutationService.replayPendingMessages`, reset any entries stuck in `MutationStatus.sending` to `MutationStatus.pending` before processing, or allow them to be replayed if the socket has disconnected and reconnected since their last attempt.

#### Fix 2: Sequentialize Cache Database Writes
Introduce a conversation-specific sequential execution queue (`Future` chain) in `MessageStore` to serialize all background cache writes (`processRealtimeMessage` and `_persistMessageToHistoryCache`), ensuring read-modify-write operations occur in strict sequence.

---

### 7. Risk Assessment
* **Web Regression Risk:** **Zero**. The proposed changes are isolated entirely to the Flutter mobile client (`ChatMutationService` and `MessageStore`). No backend APIs, database schemas, or socket events are modified.
* **Mobile Regression Risk:** **Low**. Sequentializing database writes preserves thread safety and data integrity without blocking the UI thread.

---

### 8. Verification & Rollback Strategy
* **Verification:** Verify that offline messages are successfully replayed after toggling Airplane mode, and that rapid message delivery does not result in missing history or incorrect badges.
* **Rollback:** Revert changes in `chat_mutation_service.dart` and `message_store.dart`.
