# KOVARI Production QA — Day 2
## Human QA Execution Log

**QA Operator:** Tirth
**Target:** Latest Production Android APK
**Environment:** Production
**Execution Mode:** Manual physical-device testing
**Status:** IN PROGRESS

> This document contains only manually verified results.
> Static code inspection, automated tests, API inspection, and source-code analysis do not constitute QA evidence.

---

## Scenario N1 — Push Delivery

**Module:** Notifications  
**Owner:** Tirth  
**Status:** UNVERIFIED  
**Priority:** High  
**Platform:** Production Android APK

### Preconditions

- QA account is logged in on a physical device.
- FCM permissions are granted.

### Manual Test Steps

1. Close the app completely (kill background process).
2. Send a chat message or group invitation from another account.
3. Observe if a push notification is delivered.
4. Put the app in the background.
5. Send another message, and observe.
6. Open the app in the foreground.
7. Send another message, and observe how notifications behave.

### Expected Result

Push notifications are delivered successfully across cold start, background, and foreground states without duplicates.

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

## Scenario N2 — Deep Linking

**Module:** Notifications  
**Owner:** Tirth  
**Status:** UNVERIFIED  
**Priority:** High  
**Platform:** Production Android APK

### Preconditions

- App is in the background or closed.
- A push notification for a chat message is received.

### Manual Test Steps

1. Tap on the received chat push notification.
2. Observe the app routing.
3. Verify if the app launches and opens the targeted chat conversation screen directly.

### Expected Result

Tapping the push notification bypasses the home screen and navigates the user directly to the correct chat room.

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

## Scenario S1 — Report/Block

**Module:** Safety / Moderation  
**Owner:** Tirth  
**Status:** UNVERIFIED  
**Priority:** High  
**Platform:** Production Android APK

### Preconditions

- Two QA accounts exist and can interact.

### Manual Test Steps

1. From Account A's device, navigate to Account B's public profile.
2. Tap "Report" or "Block" and submit.
3. Verify that the chat room between Account A and Account B is blocked/disbanded.
4. Verify that Account B is immediately excluded from Account A's Explore matching feed.
5. Relaunch the app and verify the block status persists.

### Expected Result

Reporting/blocking a user immediately restricts contact, terminates any active chat room, and permanently filters them out of matching queues.

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

## Scenario R1 — FCM Register

**Module:** Regression (Notifications)  
**Owner:** Tirth  
**Status:** UNVERIFIED  
**Priority:** High  
**Platform:** Production Android APK

### Preconditions

- Clean install of the APK.

### Manual Test Steps

1. Install and open the app. Log in.
2. Grant notifications permission.
3. Monitor system/network logs or database to see if the device token is generated.
4. Verify if the device token registers successfully at the `/devices/register` endpoint.

### Expected Result

Device registers its FCM token cleanly with the backend without any auth or network failures.

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

## Scenario R2 — CORS Connection

**Module:** Regression  
**Owner:** Tirth  
**Status:** UNVERIFIED  
**Priority:** Medium  
**Platform:** Production Android APK

### Preconditions

- Production environment is active.

### Manual Test Steps

1. Relaunch the app and navigate to chat or real-time views.
2. Observe if the socket connection connects successfully.
3. Check for any socket errors or API errors regarding CORS headers.

### Expected Result

Socket and API connections connect cleanly without CORS blocking policies.

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

## Scenario R4 — Live Sync Refresh

**Module:** Regression  
**Owner:** Tirth  
**Status:** UNVERIFIED  
**Priority:** High  
**Platform:** Production Android APK

### Preconditions

- Two devices/clients logged in.

### Manual Test Steps

1. Keep Account A open on the Explore/Dashboard screen.
2. From Account B, send a match interest or a group invitation.
3. Observe Account A's client.
4. Verify if the invitation or match updates dynamically without having to pull-to-refresh or restart the app.

### Expected Result

Realtime sync events update the local client state instantly without manual user action.

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
