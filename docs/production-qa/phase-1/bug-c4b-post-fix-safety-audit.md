# BUG-C4b Post-Fix Safety Audit

## 1. Implementation Reviewed
The following files and database schemas were reviewed during this safety gate:
* **Mobile Client:**
  * [chat_mutation_service.dart](file:///c:/Users/navne/CSE/DEV/KOVARI/apps/mobile/lib/features/chat/providers/chat_mutation_service.dart)
  * [message_store.dart](file:///c:/Users/navne/CSE/DEV/KOVARI/apps/mobile/lib/features/chat/providers/message_store.dart)
  * [mutation_journal.dart](file:///c:/Users/navne/CSE/DEV/KOVARI/apps/mobile/lib/core/runtime/mutation_journal.dart)
  * [messaging_validation_test.dart](file:///c:/Users/navne/CSE/DEV/KOVARI/apps/mobile/test/runtime/messaging_validation_test.dart)
* **Backend Socket Server:**
  * [events.ts](file:///c:/Users/navne/CSE/DEV/KOVARI/apps/web/src/services/socket/events.ts)
  * [server.ts](file:///c:/Users/navne/CSE/DEV/KOVARI/apps/web/src/services/socket/server.ts)
* **Database Migrations:**
  * [20260619000000_messaging_conversations_and_sequences.sql](file:///c:/Users/navne/CSE/DEV/KOVARI/supabase/migrations/20260619000000_messaging_conversations_and_sequences.sql)
  * [20260630000000_phase1_database_expansion.sql](file:///c:/Users/navne/CSE/DEV/KOVARI/supabase/migrations/20260630000000_phase1_database_expansion.sql)
  * [20260701000000_drop_e2ee_columns.sql](file:///c:/Users/navne/CSE/DEV/KOVARI/supabase/migrations/20260701000000_drop_e2ee_columns.sql)

---

## 2. Outbox State Machine
The actual lifecycle of a message send mutation follows this state flow:
1. **`pending`**: Recorded in `MutationJournal` during `sendMessage`.
2. **`sending`**: Transitioned immediately in `_emit` before calling `sendMessage` on the coordinator.
3. **`acknowledged` (`success`)**: Transitioned inside the `onAck` callback or when `message_persisted` is processed. Resolving to success deletes the mutation from the journal.
4. **`failed` (`failure`)**: Transitioned if the socket emits an error or if the 15-second timeout fires without an ACK. Left in the journal so the UI displays a retry button.
5. **`replay`**: On socket reconnection, `replayPendingMessages` reads the journal and resets any stuck `sending` states back to `pending` so they can be re-emitted.

---

## 3. Lost ACK Analysis
If the database successfully persists the message, broadcasts it, and returns an ACK, but the mobile client disconnects before receiving the ACK:
1. The server successfully committed the message to Supabase.
2. The mobile client's outbox keeps the mutation in `MutationStatus.sending` (which subsequently times out to `failed` or gets replayed on reconnect).
3. Upon reconnection, the mobile client resets the mutation to `pending` and attempts to send it again.
4. **The backend will execute another `insert` statement**, generating a new record with a new sequence number.

---

## 4. Duplicate Message Analysis
### Verdict: **UNSAFE**
The backend and database **do not enforce uniqueness or deduplication** on `client_message_id` / `client_id` / `tempId`:
* In `persistMessageToDb` (in `events.ts`), the code does not query the database to check if a message with the same `tempId` already exists before executing the insert.
* In the database schema, there is no unique constraint or index on `client_id` (only on `(conversation_id, conversation_sequence)`).
* For group messages, `client_id` / `tempId` is not even passed to the database.

Consequently, replaying a message whose ACK was lost **will create duplicate messages on the server**.

---

## 5. 15-Second Timeout Analysis
When the 15-second timeout fires:
1. The message status transitions to `failed` in the UI and journal.
2. If the message was actually persisted on the server, the server-side copy is already saved.
3. If the user taps **Retry**, or if reconnect replay triggers, a duplicate message is inserted on the server.
4. If a late `message_persisted` event arrives, the client reconciles it, but since a duplicate might have been sent, the UI/store may end up displaying both records.

---

## 6. Reconnect Replay Concurrency
* **Reset Trigger:** `sending` mutations are reset to `pending` during the `replayPendingMessages` loop on reconnect.
* **Concurrency:** The replay loop is sequential inside a single thread, but multiple reconnect callbacks (`join_chat` triggers) can theoretically run concurrently if Riverpod signals multiple connections. However, the clientMessageId checks in `store.messages` mitigate duplicate local inserts, though duplicate server packets are still emitted.

---

## 7. Cache Serialization Audit
* **Verdict:** **SAFE**.
* **Detail:** By wrapping all read-merge-write operations inside `_enqueueSyncOp` (which chains futures sequentially on `_syncQueue`), all database cache updates for a given conversation are guaranteed to execute sequentially. This eliminates the read-modify-write race condition while keeping the UI non-blocking.

---

## 8. Automated Test Coverage
* **Stuck `SENDING` Recovery:** Tested in Test 8 (`Outbox Replay Recovery for Stuck SENDING Mutations`).
* **Cache Write Serialization:** Tested in Test 9 (`Cache Write Serialization Queue in MessageStore`).
* **Duplicate Prevention:** **NOT TESTED** in the automated suite because the mock socket service automatically handles ACKs synchronously and does not duplicate server-side DB inserts.

---

## 9. Web Regression Scope
* Verified via `git status` and `git diff`. There are **zero modifications** to `apps/web/`, backend APIs, socket server, or Supabase schema.

---

## 10. Final Verdict
### **APPROVED WITH CONDITIONS**

#### Conditions:
1. **Known Duplicate Risk:** The manual QA team (Navneet and Tirth) must be aware that if a network drop occurs *exactly* after the server persists the message but *before* the ACK reaches the client, replaying the message will result in duplicate messages.
2. **Backend Remediation Required:** A separate engineering task should be created to add a `UNIQUE` index on the `client_id` column in the `direct_messages` database table, and to add a duplicate checks check on `client_id` in `persistMessageToDb` on the backend socket server to guarantee database-level idempotency.
