# BUG-C4b Tests D & E — Post-Fix Human QA Validation Protocol

> **Status:** FIX IMPLEMENTED — HUMAN QA REQUIRED

---

## Test D — 15-Second Timeout Should Show Failed Indicator

### Setup
1. Install the latest APK (production or debug build from the `dev` branch).
2. Open any **direct chat** conversation.

### Steps
1. Enable Airplane Mode or fully disable network connectivity on the device.
2. Type a message and tap Send.
3. Confirm the message appears immediately with a grey single-tick (pending state).
4. Wait **15 seconds** without restoring the network.
5. **Expected:** The message indicator changes to a **red/orange Failed** state.
6. **Expected:** A **Retry** action or button is visible (tap or long-press the message, or check inline UI).
7. Restore network connectivity.
8. Tap **Retry**.
9. **Expected:** The message transitions back to pending, then delivers normally (single tick → double tick).
10. **Expected:** Exactly **one** copy of the message appears in the conversation on both sender and receiver devices.

### Pass Criteria
- [ ] Failed indicator appears within ~1 second of the 15s timeout.
- [ ] Retry action is accessible.
- [ ] Successful retry produces exactly one delivered message.
- [ ] No duplicate messages on either device.

---

## Test E — Group Message Seen Ticks Should Persist Across Reload

### Setup
1. Use at least **two devices** (or one device + the web app) to join the **same group**.
2. Ensure both are logged in and have an active session.

### Steps
1. Send a message in the group from Device A (or web).
2. Open the group on Device B (mobile) and scroll to the message so it is clearly visible.
3. On Device A (sender), confirm the ticks turn **white** (fully seen — all relevant members have read the message).
4. Force-close the mobile app on Device A completely (swipe away from recents).
5. Reopen the mobile app on Device A.
6. Navigate back to the group conversation.
7. **Expected:** The ticks for the same message remain **white** (seen), not grey (delivered).
8. Optionally, toggle Airplane Mode off/on to force a socket reconnect while the app is open.
9. **Expected:** After reconnect, ticks remain **white**.

### Pass Criteria
- [ ] White ticks appear and remain after cold restart.
- [ ] White ticks remain after socket reconnect.
- [ ] Ticks do NOT revert to grey (delivered) on any reload or reconnect.
- [ ] No incorrect "seen" state appears when the message was genuinely not yet read by all members.

---

## Notes for QA Operator

> [!IMPORTANT]
> **Do NOT flush or manipulate production Redis** during these tests. Redis key retention has been extended to 14 days. The fix is entirely transparent.

> [!NOTE]
> Test E's Redis validation (simulating key expiry) should only be performed in a **non-production test environment** with controlled Redis access, if available. It is not required for production APK sign-off.

---

## Regression Safeguards to Confirm

- [ ] Test A (Optimistic Send + ACK) — remains PASS.
- [ ] Test B (Offline replay, no duplicates) — remains PASS.
- [ ] Test C (Cache serialization) — remains PASS.
- [ ] Test F (Backend idempotency — lost ACK replay does not duplicate) — remains PASS.
- [ ] Direct messages: Ticks and delivery status work correctly.
- [ ] Group messages: Sending and receiving messages works correctly.
