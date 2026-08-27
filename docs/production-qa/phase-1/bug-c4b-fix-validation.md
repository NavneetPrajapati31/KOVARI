# BUG-C4b Fix Validation Guide (Human QA Protocol)

This document provides step-by-step verification instructions for Navneet and Tirth to manually validate the **complete fix for BUG-C4b** (mobile-side fix + backend idempotency hotfix) using the latest APK.

---

> [!IMPORTANT]
> **Prerequisite — Apply Database Migration to Production**
> Before starting human QA, apply the migration to the production Supabase database:
> 1. Open the Supabase Dashboard → SQL Editor.
> 2. Run the content of `supabase/migrations/20260708000000_direct_messages_client_id_unique.sql`.
> 3. Confirm execution with no errors. This creates the partial unique index that prevents duplicate message rows.

---

### Test A — Normal Messaging & Replay
**Goal:** Confirm normal message sending and receiving operates reliably under stable connection.
1. Open direct chat between Account A (mobile) and Account B (web).
2. Send 5–10 messages in both directions.
3. Confirm instant delivery, optimistic rendering, and transition to grey/blue ticks (Sent -> Delivered -> Seen).

---

### Test B — Outbox Replay & Connection Loss Recovery
**Goal:** Verify that in-flight messages are not permanently lost if network drops before an ACK is received.
1. Open direct chat on mobile.
2. Prepare a text message: *"Test Network Drop Replay"*.
3. Place device in Airplane mode or toggle Wi-Fi/cellular off.
4. Tap **Send** (message should render optimistically in a pending state).
5. Restore network connectivity.
6. Observe:
   * Socket reconnects.
   * The pending message is automatically replayed and successfully delivered to the recipient.
   * Verify that exactly one instance of the message exists (no duplicates).

---

### Test C — Rapid Message Stream Cache Integrity
**Goal:** Verify that rapid concurrent incoming/outgoing messages do not trigger read-modify-write race conditions and data loss in the local database cache.
1. Open direct chat.
2. From the Web client (Account B), send **10–15 messages in rapid succession** (e.g. paste blocks or click send repeatedly).
3. Confirm that **every single message** renders on the mobile client's screen in the correct order.
4. Force-close the mobile application immediately.
5. Relaunch the mobile app and open the chat.
6. Verify that all 10–15 messages are fully persisted and none are missing (verifying sequential serialization queue).

---

### Test D — Hot Reconnection Audit
**Goal:** Verify outbox timeout and state recovery.
1. Prepare a message on mobile.
2. Disconnect the backend server or socket port (or toggle internet right as you hit send).
3. Ensure that after 15 seconds, the mobile UI transitions the stuck message's indicator to **Failed** (red status), allowing manual retry.
4. Reconnect internet, tap **Retry**, and verify the message delivers successfully.

---

### Test E — Cross-Platform Verification
1. Verify that sending direct messages, group messages, and media uploads (images/videos) between Mobile and Web work bidirectionally without regressions.
2. Verify that typing indicators, presence, and delivery receipts sync seamlessly.

---

### Test F — Backend Idempotency (No Duplicate Server Records)
**Goal:** Confirm that a lost-ACK replay scenario does NOT create duplicate messages in the database.

> This test requires two physical devices or one device + a web session.

1. **Set up:** Open Account A on mobile, Account B on web. Keep both chat screens open.
2. **Simulate lost ACK:** On the mobile device, send a message while briefly toggling Airplane Mode on immediately after tapping Send (aim to drop the connection within ~1 second of sending).
3. **Restore network:** Toggle Airplane Mode off within 3 seconds.
4. **Observe mobile:** The outbox should replay the message automatically on reconnect. It should deliver successfully.
5. **Verify no duplicate on Account B (web):** Only **one** instance of the message must appear in the web chat window.
6. **Verify no duplicate on Account A (mobile):** Only **one** instance of the message must appear in the mobile chat window (the optimistic one that became confirmed — not two identical messages).
7. **Repeat 3 times** with different network-drop timings to stress-test the window.

**Pass criteria:** In all 3 repetitions, exactly one message appears on both sides. No "double send" is visible to either participant.

