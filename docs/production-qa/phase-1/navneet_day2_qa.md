# KOVARI Production QA — Day 2
## Human QA Execution Log

**QA Operator:** Navneet
**Target:** Latest Production Android APK
**Environment:** Production
**Execution Mode:** Manual physical-device testing
**Status:** IN PROGRESS

> This document contains only manually verified results.
> Static code inspection, automated tests, API inspection, and source-code analysis do not constitute QA evidence.

---

## Scenario A6 — Token Refresh

**Module:** Authentication  
**Owner:** Navneet  
**Status:** UNVERIFIED  
**Priority:** High  
**Platform:** Production Android APK

### Preconditions

- QA account is available.
- User is authenticated.
- Production APK is installed.

### Manual Test Steps

1. Log in with the QA account on the production APK to establish a session.
2. Wait for the access token to expire (or simulate/force token expiration if duration is known and testing is possible).
3. Perform an action that requires API authentication (e.g., refresh the profile or navigate to feed).
4. Observe if the API call succeeds silently via token rotation without logging the user out.

### Expected Result

Access token rotates silently behind the scenes; the user continues their session uninterrupted without being forced back to the Login screen.

### Actual Result

The access token rotated silently behind the scenes when performing authenticated actions (refreshing profile and navigation). The session continued without any interruption or unexpected redirection to the login screen.

### Evidence

- Screenshot: N/A (Silent success)
- Screen recording: N/A
- Timestamp: 2026-08-27T17:06:00Z
- Device: Physical Android Device
- APK version/build: Latest Production APK

### QA Result

**PASS**

---

## Scenario G1 — Group Lifecycle

**Module:** Groups  
**Owner:** Navneet  
**Status:** UNVERIFIED  
**Priority:** High  
**Platform:** Production Android APK

### Preconditions

- QA account is available and logged in.
- Production APK is installed.

### Manual Test Steps

1. Navigate to the Groups tab and tap "New group".
2. Fill in all details (Name, Destination, Budget, Dates) and select a cover image, then tap "Create".
3. Verify if the group is successfully created and shown in "My Groups".
4. Open the group details, tap Edit, modify a field (e.g., change the budget), and save.
5. Verify the edits reflect immediately in the UI.
6. Disband/Delete the group and confirm it is removed from "My Groups".

### Expected Result

Group creation succeeds, edits apply immediately, and deleting the group removes it completely from the list without errors.

### Actual Result

Successfully created a temporary QA group. The group appeared in the 'My Groups' list immediately. Opened details, edited the budget field, and confirmed edits were saved. After force closing and reopening the app, the changes persisted. Successfully disbanded/deleted the group and verified it disappeared from all lists without error.

### Evidence

- Screenshot: N/A
- Screen recording: N/A
- Timestamp: 2026-08-27T17:18:00Z
- Device: Physical Android Device
- APK version/build: Latest Production APK

### QA Result

**PASS**

---

## Scenario G2 — Group Membership

**Module:** Groups  
**Owner:** Navneet  
**Status:** UNVERIFIED  
**Priority:** High  
**Platform:** Production Android APK

### Preconditions

- Two QA accounts are available.
- A group exists (owned by Account A).
- Account B is logged in on a device.

### Manual Test Steps

1. Using Account B, search for or find the group created by Account A.
2. Request to join the group (or use join code/invite flow if applicable).
3. Log in with Account A (Creator) and check join requests.
4. Approve Account B's join request.
5. Verify that Account B is now listed as an active member in the group member list on both accounts.

### Expected Result

Join request is sent, received by the creator, can be approved, and member list updates correctly on both clients.

### Actual Result

FAIL — Verified that the join request was successfully submitted by Account B and received by Account A (Creator). However, two bugs occurred:
1. After accepting or rejecting the join request, it still shows in the UI and is not removed.
2. Although the user gets added as an accepted member in the backend, they are not visible in the group member list on the UI.

### Evidence

- Screenshot: Pending
- Screen recording: Pending
- Timestamp: 2026-08-27T17:26:00Z
- Device: Physical Android Device
- APK version/build: Latest Production APK

### Failure Details

**Reproduction Steps**

1. Create a QA group on Account A.
2. Request to join the group from Account B.
3. Open the join requests list on Account A and tap approve.
4. Verify if the request item is dismissed and if Account B appears in the group member list screen.

**Expected Behavior**

Approving the request dismisses the request item from the pending list immediately and displays the newly joined user in the active group members list.

**Actual Behavior**

The request item remains stuck in the pending request UI even after action is taken. The newly accepted user is not visible in the UI's active member list (although added in backend).

**Affected Platform**

Production Android APK

**Severity**

Medium

**Evidence**

- Screenshot: N/A
- Screen recording: N/A
- Timestamp: 2026-08-27T17:26:00Z
- Relevant logs: N/A

**Backend Impact**

Confirmed (Backend registers the member addition correctly, suggesting a UI-only state update/binding failure).

**Bug ID**

Pending reconciliation

### QA Result

**FAIL**

---

## Scenario G3 — Itinerary Sync

**Module:** Groups  
**Owner:** Navneet  
**Status:** UNVERIFIED  
**Priority:** High  
**Platform:** Production Android APK

### Preconditions

- Group exists with both Account A and Account B as members.
- Both users are logged in (cross-device/platform validation).

### Manual Test Steps

1. On Account A's device, navigate to the group's "Itinerary" tab.
2. Add a new itinerary item (Activity name, location, date, time).
3. Save the item and verify it renders on Account A's screen.
4. On Account B's device, open the group's "Itinerary" tab.
5. Verify if the new itinerary item appears instantly or after a simple pull-to-refresh.

### Expected Result

Itinerary additions sync reliably and render correctly for all members of the group.

### Actual Result

FAIL — Created an itinerary item on the web application while keeping the mobile application open, but the new item did not show up at all on the mobile group itinerary screen even after refreshing and reloading.

### Evidence

- Screenshot: Pending
- Screen recording: Pending
- Timestamp: 2026-08-27T17:32:00Z
- Device: Physical Android Device
- APK version/build: Latest Production APK

### Failure Details

**Reproduction Steps**

1. Log into the mobile APK as User A and open a group's itinerary tab.
2. Using User B (or the web app), add an itinerary item to the same group.
3. Observe the mobile screen.
4. Try to trigger a manual pull-to-refresh or back out and reopen the group screen.
5. Verify if the item is displayed.

**Expected Behavior**

Added itinerary items should appear on the mobile client either immediately (via socket/real-time event sync) or after a pull-to-refresh / screen reload.

**Actual Behavior**

Itinerary updates do not sync to the mobile client; the list remains stale regardless of refreshing, reloading, or reopening the screen.

**Affected Platform**

Production Android APK

**Severity**

High

**Evidence**

- Screenshot: N/A
- Screen recording: N/A
- Timestamp: 2026-08-27T17:32:00Z
- Relevant logs: N/A

**Backend Impact**

Unknown (Suspected mobile cache hydration or sync listener failure).

**Bug ID**

Pending reconciliation

### QA Result

**FAIL**

---

## Scenario C1 — Realtime Send/Recv

**Module:** Chat  
**Owner:** Navneet  
**Status:** UNVERIFIED  
**Priority:** High  
**Platform:** Production Android APK

### Preconditions

- Two QA accounts are matched and have a chat room.
- Account A is on the mobile APK; Account B can be on the web application or another device.

### Manual Test Steps

1. Open the chat room on both clients.
2. Send a message from Account A (mobile).
3. Observe if Account B receives it instantly.
4. Send a message from Account B.
5. Observe if Account A receives it instantly on mobile.

### Expected Result

Messages are delivered and received in near real-time without manual page refreshes.

### Actual Result

PASS — Core realtime send/receive functionality works correctly. Messages sent from mobile arrive on the other client instantly and vice versa without manual refresh. Message ordering, timestamps, sender attribution, and persistence after leaving and reopening the chat are all correct.

**Additional Observations (not blocking PASS, flagged for reconciliation):**

1. **Inbox Conversation Leak (Multi-account):** When switching between multiple accounts on the same physical device, conversations from one account's session appear in the other account's inbox UI. This is a session isolation/state cleanup issue specific to same-device account switching.
2. **Notification → Chat Message Delay:** When a push notification arrives and is tapped, the correct chat screen opens — but the new messages that triggered the notification do not appear instantly in the message list. The user lands on the chat but must wait a moment (or scroll/refresh) before the messages are rendered.

### Evidence

- Screenshot: N/A
- Screen recording: N/A
- Timestamp: 2026-08-27T17:52:00Z
- Device: Physical Android Device
- APK version/build: Latest Production APK

### QA Result

**PASS**

> **Note:** Two secondary findings captured above are pending triage during reconciliation — they do not block the core C1 scenario result.

---

## Scenario C2 — Receipts

**Module:** Chat  
**Owner:** Navneet  
**Status:** UNVERIFIED  
**Priority:** Medium  
**Platform:** Production Android APK

### Preconditions

- Matched chat room exists between Account A and Account B.

### Manual Test Steps

1. Send a message from Account A (mobile) to Account B (who is offline or has the chat closed).
2. Verify the status shows sent (single tick or sent indicator).
3. Have Account B open the app/chat.
4. Verify the status updates to delivered / read (double tick / read status) on Account A's mobile screen.

### Expected Result

Delivery and read receipt ticks update dynamically as the other participant interacts with the chat.

### Actual Result

Delivery and read receipt state progressed correctly: Sent → Delivered → Read. All transitions updated dynamically without requiring manual refresh. No stuck states or incorrect receipt attribution observed.

### Evidence

- Screenshot: N/A
- Screen recording: N/A
- Timestamp: 2026-08-27T18:00:00Z
- Device: Physical Android Device
- APK version/build: Latest Production APK

### QA Result

**PASS**

---

## Scenario C3 — Presence/Typing

**Module:** Chat  
**Owner:** Navneet  
**Status:** UNVERIFIED  
**Priority:** Medium  
**Platform:** Production Android APK

### Preconditions

- Active chat room open on both devices.

### Manual Test Steps

1. Start typing a message on Account B's keyboard.
2. Observe if a "typing..." indicator appears on Account A's mobile chat screen.
3. Stop typing on Account B.
4. Observe if the indicator disappears.
5. Verify online/offline status indicators update when a user opens or closes the app.

### Expected Result

Typing status and active presence indicators show and hide dynamically with low latency.

### Actual Result

Typing indicator appeared on Account A's screen when Account B began typing, and disappeared when Account B stopped. Online/offline presence states updated correctly when the other account closed and reopened the app. All observations verified as expected.

### Evidence

- Screenshot: N/A
- Screen recording: N/A
- Timestamp: 2026-08-27T18:02:00Z
- Device: Physical Android Device
- APK version/build: Latest Production APK

### QA Result

**PASS**

---

## Scenario C4 — Offline Recovery

**Module:** Chat  
**Owner:** Navneet  
**Status:** UNVERIFIED  
**Priority:** High  
**Platform:** Production Android APK

### Preconditions

- Matched chat room exists.

### Manual Test Steps

1. Open the chat on the mobile APK.
2. Toggle the device's internet connection off (go offline).
3. Try sending a message (should show pending / offline state).
4. Send a message from the other user (Account B) while Account A is offline.
5. Turn cellular data / Wi-Fi back on.
6. Verify if the pending message sends automatically and if incoming messages sync correctly without losing history.

### Expected Result

Socket reconnects automatically upon network recovery; pending messages are sent, and missed messages are populated without duplicates.

### Actual Result

FAIL — Offline recovery is partially functional with two confirmed issues:

1. **Incoming messages (PASS):** Messages sent by Account B while Account A was offline were received correctly once network was restored.
2. **Outgoing messages (FAIL):** Messages composed and attempted to be sent from mobile while offline do **not** get delivered after network is restored. They are silently dropped with no retry mechanism.
3. **Reliability (FAIL):** Even under normal conditions, message sending and receiving is non-deterministic — sometimes it works, sometimes it does not. There is no 100% guaranteed delivery.

### Evidence

- Screenshot: Pending
- Screen recording: Pending
- Timestamp: 2026-08-27T18:15:00Z
- Device: Physical Android Device
- APK version/build: Latest Production APK

### Failure Details

**Reproduction Steps**

1. Open an active chat on the mobile APK.
2. Turn off Wi-Fi and mobile data to go offline.
3. Type a message and attempt to send it while offline.
4. Re-enable network connectivity.
5. Observe if the queued outgoing message is delivered automatically.

**Expected Behavior**

Messages composed while offline are queued locally and delivered automatically upon reconnection. No message loss in either direction.

**Actual Behavior**

- Outgoing messages attempted while offline are not delivered after reconnection — they are silently discarded.
- Message delivery is generally unreliable with intermittent failures even when both parties are online.

**Affected Platform**

Production Android APK

**Severity**

High

**Evidence**

- Screenshot: N/A
- Screen recording: N/A
- Timestamp: 2026-08-27T18:15:00Z
- Relevant logs: N/A

**Backend Impact**

Unknown — may be a socket reconnection issue on the mobile client, or missing offline message queue persistence. Root cause pending forensic investigation.

**Bug ID**

Pending reconciliation

### QA Result

**FAIL**

---

## Scenario R3 — Inbox Snippet

**Module:** Regression (Chat)  
**Owner:** Navneet  
**Status:** UNVERIFIED  
**Priority:** Low  
**Platform:** Production Android APK

### Preconditions

- Conversation history exists in the inbox.

### Manual Test Steps

1. Navigate to the Inbox/Chats screen.
2. Send a new message to the logged-in user from another account.
3. Observe the conversation list.
4. Verify if the preview snippet displays the actual content of the last sent message instead of a generic placeholder.

### Expected Result

The last message snippet in the inbox list updates instantly and displays the accurate message text.

### Actual Result

FAIL — When a new message arrives while the app is open and active, it shows the correct snippet text and count indicator (shown in 2nd image). However, if a new message arrives while the mobile app is closed, the inbox screen does not render the correct "Sent a message" preview and badge/count indicator (shown in 1st image).

### Evidence

- Screenshot 1 (App closed/launched): [app_closed_launch.png](file:///C:/Users/navne/CSE/DEV/KOVARI/docs/production-qa/phase-1/app_closed_launch.png)
- Screenshot 2 (App active): [app_active.png](file:///C:/Users/navne/CSE/DEV/KOVARI/docs/production-qa/phase-1/app_active.png)
- Screen recording: N/A
- Timestamp: 2026-08-27T20:36:00Z
- Device: Physical Android Device
- APK version/build: Latest Production APK

### Failure Details

**Reproduction Steps**

1. Force close the KOVARI app on mobile.
2. Send a new message to the mobile user from another client.
3. Open the app on mobile and immediately navigate to the Chats/Inbox tab.
4. Verify if the list item has the correct message snippet and the unread count indicator.
5. Contrast this with the same test when the app remains open/active in the foreground during delivery.

**Expected Behavior**

Regardless of whether the app was open, closed, or in the background during message delivery, the inbox screen should load/hydrate correctly with the latest snippet ("Sent a message" or custom text) and display the correct unread badge count.

**Actual Behavior**

- When launched from a closed state, the inbox conversation row displays raw/incorrect preview data ("test 21") and completely lacks the unread count indicator (the blue circle badge).
- In contrast, when the app is active in the foreground, the row renders correctly with "Sent a message" and the unread count badge.

**Affected Platform**

Production Android APK

**Severity**

Medium

**Evidence**

- Screenshot: Captured and linked above.
- Screen recording: N/A
- Timestamp: 2026-08-27T20:36:00Z
- Relevant logs: N/A

**Backend Impact**

Suspected (State hydration mismatch between cold start database/cache read vs. live socket payload update).

**Bug ID**

Pending reconciliation

### QA Result

**FAIL**
