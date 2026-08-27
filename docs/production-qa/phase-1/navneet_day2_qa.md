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

UNVERIFIED — awaiting manual execution.

### Evidence

- Screenshot: Pending
- Screen recording: Pending
- Timestamp: Pending
- Device: Pending
- APK version/build: Pending

### QA Result

**UNVERIFIED**

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

UNVERIFIED — awaiting manual execution.

### Evidence

- Screenshot: Pending
- Screen recording: Pending
- Timestamp: Pending
- Device: Pending
- APK version/build: Pending

### QA Result

**UNVERIFIED**

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

UNVERIFIED — awaiting manual execution.

### Evidence

- Screenshot: Pending
- Screen recording: Pending
- Timestamp: Pending
- Device: Pending
- APK version/build: Pending

### QA Result

**UNVERIFIED**

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

UNVERIFIED — awaiting manual execution.

### Evidence

- Screenshot: Pending
- Screen recording: Pending
- Timestamp: Pending
- Device: Pending
- APK version/build: Pending

### QA Result

**UNVERIFIED**

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

UNVERIFIED — awaiting manual execution.

### Evidence

- Screenshot: Pending
- Screen recording: Pending
- Timestamp: Pending
- Device: Pending
- APK version/build: Pending

### QA Result

**UNVERIFIED**

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

UNVERIFIED — awaiting manual execution.

### Evidence

- Screenshot: Pending
- Screen recording: Pending
- Timestamp: Pending
- Device: Pending
- APK version/build: Pending

### QA Result

**UNVERIFIED**

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

UNVERIFIED — awaiting manual execution.

### Evidence

- Screenshot: Pending
- Screen recording: Pending
- Timestamp: Pending
- Device: Pending
- APK version/build: Pending

### QA Result

**UNVERIFIED**

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

UNVERIFIED — awaiting manual execution.

### Evidence

- Screenshot: Pending
- Screen recording: Pending
- Timestamp: Pending
- Device: Pending
- APK version/build: Pending

### QA Result

**UNVERIFIED**

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

UNVERIFIED — awaiting manual execution.

### Evidence

- Screenshot: Pending
- Screen recording: Pending
- Timestamp: Pending
- Device: Pending
- APK version/build: Pending

### QA Result

**UNVERIFIED**
