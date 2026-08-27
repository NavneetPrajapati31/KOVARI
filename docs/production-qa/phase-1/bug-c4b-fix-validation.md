# BUG-C4b Fix Validation Guide (Human QA Protocol)

This document provides step-by-step verification instructions for Navneet and Tirth to manually validate the mobile-side fixes for **BUG-C4b (Intermittent Realtime Chat Message Delivery Failures)** using the latest APK.

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
