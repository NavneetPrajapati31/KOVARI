# BUG-C1a Fix Validation Guide (Human QA Protocol)

Manual verification for **same-device multi-account chat session isolation** after the BUG-C1a fix.

**Platform:** Physical Android device with release APK containing the fix.  
**Environment:** Production (or staging with real multi-account QA users).  
**Accounts:** Account A and Account B (must not share inbox data).

---

## Prerequisites

1. Install the **latest release APK** built after the BUG-C1a fix.
2. Confirm two distinct QA accounts (A and B) with existing chat history on A.
3. Use **only the Android APK** — do not substitute Chrome/web for this test.
4. Record device model, APK build/version, and timestamps.

---

## Test A — Basic Account Switching

**Goal:** Inbox shows only the active account after logout → login.

1. Login as **Account A**.
2. Open **Inbox** — note conversation titles/snippets.
3. Open one conversation; confirm messages load.
4. **Logout** from Profile/Settings.
5. Login as **Account B**.
6. Open **Inbox** immediately (do not pull-to-refresh first).

**Pass criteria:**

- No Account A conversation titles, avatars, or snippets visible.
- Only Account B's inbox (or empty inbox if B has no chats).
- No Account A unread badges.

---

## Test B — Force-Close Isolation

**Goal:** Cold start does not restore prior account chat state.

1. Login as **Account A** → open **Chat** with a known conversation.
2. **Logout**.
3. Login as **Account B**.
4. **Force-close** the app (swipe away from Recents).
5. Relaunch → open **Inbox** and any chat entry points.

**Pass criteria:**

- Still no Account A data after cold start.
- Account B session only.

---

## Test C — Repeated Switching

**Goal:** No accumulation across A → B → A → B → A cycles.

1. Perform: **A login → Inbox → Logout → B login → Inbox → Logout → A login → Inbox → Logout → B login → Inbox**.
2. Observe inbox after **each** B login and **each** A login.

**Pass criteria:**

- Each login shows only that account's inbox.
- No stale snippets from the previous session in the chain.

---

## Test D — Active Chat Isolation

**Goal:** Account A message bodies never appear while Account B is logged in.

1. Login as **Account A**; open a chat with identifiable message text (e.g. unique string `C1A-TEST-123`).
2. Logout → login as **Account B**.
3. Navigate to **Inbox** and attempt to open any chat.
4. Search inbox for Account A partner names or `C1A-TEST-123`.

**Pass criteria:**

- Account A message text never renders.
- No Account A partner thread opens with A's history.

---

## Test E — Socket / Realtime Isolation

**Goal:** Account B receives only Account B realtime events.

**Setup:** Account A on web (or second device), Account B on Android APK.

1. Login as **Account B** on Android; open Inbox/Chat.
2. From **Account A** (web), send a message to a thread that belongs **only to Account A** (not shared with B).
3. Confirm Android (B) does **not** show that message in B's inbox.
4. Send a message from web to a **valid B thread** — confirm B receives it normally.

**Pass criteria:**

- Cross-account socket/event leakage does not occur.
- Valid B threads still receive realtime updates.

---

## Test F — Outbox Isolation (optional but recommended)

**Goal:** Account A pending send does not deliver under Account B.

1. Login as **Account A**; open chat.
2. Enable **Airplane mode**; type `C1A-OUTBOX-TEST`; tap **Send** (optimistic pending).
3. **Logout** while still offline (or online after pending state shown).
4. Login as **Account B**; restore network.
5. Wait 30s; check B's chats and A's chat (web) for spurious delivery.

**Pass criteria:**

- `C1A-OUTBOX-TEST` does not appear under Account B.
- Message does not send as Account B to wrong recipient.

---

## Evidence Template (on FAIL)

```
Scenario:
Device:
APK build:
Account:
Exact reproduction steps:
Expected:
Actual:
Frequency:
Timestamp:
Screenshot/video:
```

---

## Sign-off States

| Outcome | Tracker text |
| :--- | :--- |
| All tests pass | `VERIFIED PASS — QA SIGN-OFF COMPLETE` |
| Any test fails | `FIX IMPLEMENTED — HUMAN QA FAILED` |

Do **not** update `mobile_regression_matrix.md` during this validation.
