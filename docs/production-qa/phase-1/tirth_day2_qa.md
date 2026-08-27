# KOVARI Production QA — Day 2
## Human QA Execution Log

**QA Operator:** Tirth
**Target:** Latest Production Android APK
**Environment:** Production
**Execution Mode:** Manual physical-device testing
**Status:** COMPLETE

> This document contains only manually verified results.
> Static code inspection, automated tests, API inspection, and source-code analysis do not constitute QA evidence.

---

## Scenario N1 — Push Delivery

**Module:** Notifications  
**Owner:** Tirth  
**Status:** FAIL  
**Priority:** High  
**Platform:** Production Android APK

### Preconditions

- QA account is logged in on a physical device.
- FCM permissions are granted.
- Account A logged in on Android production APK; Account B on web (sender).

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

Per-state observations (manual, production Android APK):

1. **App completely closed (killed)** — PASS with delay  
   Push notification arrived after Account B sent a chat message/invite from web. Delivery was slightly delayed (~1–2 seconds). Notification did arrive while the app remained killed.

2. **App backgrounded (Home pressed)** — FAIL  
   Opened the app, pressed Home to background it, then Account B sent a message. No usable push notification was observed while the app stayed in the background. After reopening the app, the notification appeared on the phone. Background delivery while the app remains backgrounded was not confirmed.

3. **App foreground (open on Home)** — FAIL (in-app behavior)  
   With the app open in the foreground on the Home screen, Account B sent a message. A system/phone notification arrived, but no in-app notification/banner appeared on the Home page.

Duplicates were not reported for the killed-state delivery. Foreground and background behavior do not meet the expected multi-state delivery/UX criteria.

### Evidence

- Screenshot: Pending (operator to attach if available)
- Screen recording: Pending
- Timestamp: 2026-08-27 (Day 2 evening session, IST)
- Device: Physical Android (Tirth)
- APK version/build: Latest production APK (exact build string pending)
- Accounts: Account A = Android receiver; Account B = web sender
- App states tested: killed / backgrounded / foreground Home
- Notification permission: Granted (assumed; notifications did arrive in killed + reopen cases)

### FAIL evidence (background)

```
Scenario: N1 State 2 — backgrounded push delivery
Device: Physical Android (Tirth)
APK build: Latest production APK (exact string pending)
Account: A on Android (receiver), B on web (sender)
Exact reproduction steps:
  1. Log in as Account A on production Android APK.
  2. Open the app, then press Home to background it (do not force-close).
  3. From Account B on web, send a chat message/invite to Account A.
  4. Keep the Android app backgrounded and watch the notification shade.
  5. Reopen the Android app.
Expected: Push notification arrives while the app remains backgrounded.
Actual: No notification observed while backgrounded; notification appeared only after reopening the app.
Frequency: Observed in this session (1 run reported)
Timestamp: 2026-08-27 IST
Screenshot/video: Pending
Visible error: None
App state: background
Notification permission state: Granted (notifications arrive in other states)
Approximate time event was generated: Immediately before reopen observation
Whether any notification arrived later: Yes — after app was opened again
```

### FAIL evidence (foreground in-app)

```
Scenario: N1 State 3 — foreground in-app banner on Home
Device: Physical Android (Tirth)
APK build: Latest production APK (exact string pending)
Account: A on Android (receiver), B on web (sender)
Exact reproduction steps:
  1. Keep Account A production APK open in foreground on Home.
  2. From Account B on web, send a chat message/invite to Account A.
  3. Observe Home UI and system notification shade.
Expected: Correct in-app notification/banner behavior while app is foregrounded.
Actual: System/phone notification arrived; no in-app notification/banner on the Home page.
Frequency: Observed in this session (1 run reported)
Timestamp: 2026-08-27 IST
Screenshot/video: Pending
Visible error: None
App state: foreground (Home)
Notification permission state: Granted
Approximate time event was generated: During foreground observation
Whether any notification arrived later: System notification arrived; in-app banner did not
```

### QA Result

**FAIL**

- Killed: notification delivered (~1–2s delay)
- Background: notification not observed until app reopened
- Foreground: system notification only; no Home in-app banner

---

## Scenario N2 — Deep Linking

**Module:** Notifications  
**Owner:** Tirth  
**Status:** PASS  
**Priority:** High  
**Platform:** Production Android APK

### Preconditions

- App is in the background or closed.
- A push notification for a chat message is received.
- Account A on Android production APK; Account B on web (sender).

### Manual Test Steps

1. Tap on the received chat push notification.
2. Observe the app routing.
3. Verify if the app launches and opens the targeted chat conversation screen directly.

### Expected Result

Tapping the push notification bypasses the home screen and navigates the user directly to the correct chat room.

### Actual Result

Both deep-link paths verified manually:

1. **Background** — Tapping the chat push notification opened the **correct chat** (respective conversation with sender).
2. **Cold start / killed** — Tapping the chat push notification also opened the **correct chat**.

**Routing note:** For both tests, Home was briefly visible for about a **microsecond**, then the app **auto-redirected** to the correct chat. Final destination was correct; notification payload/target was not lost. Incorrect destination was not observed.

### Evidence

- Screenshot: Pending
- Screen recording: Pending
- Timestamp: 2026-08-27 (Day 2 evening session, IST)
- Device: Physical Android (Tirth)
- APK version/build: Latest production APK (exact build string pending)
- Accounts: Account A = Android (notification tap); Account B = web (chat sender)
- Background tap destination: Correct chat (after brief Home flash)
- Cold-start tap destination: Correct chat (after brief Home flash)
- Incorrect destination: None
- Notification payload lost: No (chat target resolved)

### QA Result

**PASS**

- Background → correct chat
- Killed/cold start → correct chat
- Brief Home flash then auto-redirect to chat (cosmetic/routing intermediate; final target correct)
**Module:** Safety / Moderation  
**Owner:** Tirth  
**Status:** FAIL  
**Priority:** High  
**Platform:** Production Android APK

### Preconditions

- Two QA accounts exist and can interact.
- Account A logged in on Android production APK; Account B available as the target profile.

### Manual Test Steps

1. From Account A's device, navigate to Account B's public profile.
2. Tap "Report" or "Block" and submit.
3. Verify that the chat room between Account A and Account B is blocked/disbanded.
4. Verify that Account B is immediately excluded from Account A's Explore matching feed.
5. Relaunch the app and verify the block status persists.

### Expected Result

Reporting/blocking a user immediately restricts contact, terminates any active chat room, and permanently filters them out of matching queues.

### Actual Result

Manual observations on production Android APK (Account A blocking Account B):

1. **Block → messaging** — After Account A blocked Account B, messages were **not delivered**. Messaging restriction after block behaved as expected for delivery.

2. **Block → profile visibility** — Account A could **still see Account B's profile** after blocking. Block did not hide/remove profile visibility for the blocker.

3. **Block persistence** — After restarting the Android app, Account B remained blocked (block state persisted across restart).

4. **Unblock UX** — The Unblock control on phone required **multiple touches** before it registered/completed. Interaction felt unresponsive and needs UX improvement (not smooth).

5. **Report UX** — Same multi-touch / unresponsive behavior observed on Report.

6. **Post-unblock Report availability** — After successfully unblocking, Account A could **Report again**. Operator notes that this block/unblock/report state logic should be rewritten (current flow feels inconsistent / needs product-logic review).

Explore exclusion after block was not separately confirmed in this note beyond messaging + profile visibility + persistence.

### Evidence

- Screenshot: Pending (operator to attach if available)
- Screen recording: Pending
- Timestamp: 2026-08-27 (Day 2 evening session, IST)
- Device: Physical Android (Tirth)
- APK version/build: Latest production APK (exact build string pending)
- Accounts: Account A = Android (blocker); Account B = blocked/reported target

### FAIL evidence (profile still visible after block)

```
Scenario: S1 — Block does not hide target profile
Device: Physical Android (Tirth)
APK build: Latest production APK (exact string pending)
Account: A on Android (blocker), B = target
Exact reproduction steps:
  1. On Android, log in as Account A.
  2. Open Account B's public profile.
  3. Overflow/menu → Block → confirm.
  4. Observe whether B's profile remains accessible/visible.
  5. Attempt to message B.
Expected: Block restricts contact and removes/hides inappropriate post-block profile access per product rules; messaging blocked.
Actual: Messages were not delivered after block (messaging restricted). Account A could still see Account B's profile after blocking.
Frequency: Observed in this session
Timestamp: 2026-08-27 IST
Screenshot/video: Pending
Visible error: None
```

### FAIL evidence (Unblock / Report UX + post-unblock report logic)

```
Scenario: S1 — Unblock/Report multi-touch UX and post-unblock Report availability
Device: Physical Android (Tirth)
APK build: Latest production APK (exact string pending)
Account: A on Android
Exact reproduction steps:
  1. With B blocked, restart Account A's APK and confirm block still present.
  2. Attempt Unblock on phone.
  3. Observe tap responsiveness.
  4. Attempt Report (same session / related flow).
  5. Complete Unblock, then attempt Report again.
Expected: Unblock and Report respond to a single clear tap; post-block/unblock/report state transitions follow coherent product rules.
Actual: Unblock required multiple touches (not smooth). Report similarly required multiple touches. After Unblock completed, Report was available again; operator flags that this logic should be rewritten.
Frequency: Observed in this session
Timestamp: 2026-08-27 IST
Screenshot/video: Pending
Visible error: None (UI felt unresponsive / multi-tap required)
```

### QA Result

**FAIL**

- Messaging after block: not delivered (works)
- Profile after block: still visible
- Block after app restart: persists
- Unblock: multi-touch / not smooth — needs improvement
- Report: multi-touch / not smooth — needs improvement
- After Unblock: can Report again — operator requests logic rewrite

---

## Scenario R1 — FCM Register

**Module:** Regression (Notifications)  
**Owner:** Tirth  
**Status:** PASS (partially observable)  
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

Device-side clean-install path executed on production Android APK:

1. Uninstalled / reinstalled latest production APK (as practical).
2. Launched app, allowed notification permission, logged in as Account A.
3. Allowed initialization to complete.
4. Account B (web) sent a chat message to Account A.
5. Android **did receive a push notification** on the app.

Notification delivery still takes noticeable time (delay observed; consistent with N1 killed-state ~1–2s / general slowness).

End-user notification behavior verified; direct FCM registration endpoint response not independently observable from the device.

Do **not** claim `/devices/register` succeeded merely because a notification arrived.

### Evidence

- Screenshot: Pending
- Screen recording: Pending
- Timestamp: 2026-08-27 (Day 2 evening session, IST)
- Device: Physical Android (Tirth)
- APK version/build: Latest production APK (exact build string pending)
- Accounts: Account A = Android (clean install / receiver); Account B = web (sender)
- Notification permission: Allowed
- Push arrived: Yes (with delay)
- `/devices/register` response: Not independently observable from device

### QA Result

**PASS (partially observable)**

- Push after clean install + login + permission: Yes (delayed)
- Direct FCM `/devices/register` success: Not verified from device

---

## Scenario R2 — Production Realtime Connection

**Module:** Regression (Realtime / Socket)  
**Owner:** Tirth  
**Status:** PASS  
**Priority:** Medium  
**Platform:** Production Android APK

> Note: Scenario title historically said "CORS Connection". CORS is primarily a browser-side policy. This Android APK run records **actual mobile realtime symptoms**, not CORS classification.

### Preconditions

- Production environment is active.
- Account A on Android APK; Account B on web.

### Manual Test Steps

1. Relaunch the app and navigate to chat or real-time views.
2. Observe if the socket connection connects successfully.
3. Check for any socket errors or API errors regarding CORS headers.

### Expected Result

Production realtime functionality works without network/authentication failures that prevent chat. Socket should disconnect cleanly when offline and resume when connectivity returns.

### Actual Result

1. **Online (network on)** — Messages delivered and received **both ways** (Android ↔ web) **without leaving chat**. Realtime chat worked.

2. **Offline (Wi‑Fi and internet off)** — Android showed **"no internet connection"** along with **"chat connection failed"**.

3. **Reconnect (network on again)** — Chat worked again after connectivity restored; send/receive resumed successfully. Reconnect completed.

No CORS classification applied (Android APK QA).

### Evidence

- Screenshot: Pending
- Screen recording: Pending
- Timestamp: 2026-08-27 (Day 2 evening session, IST)
- Device: Physical Android (Tirth)
- APK version/build: Latest production APK (exact build string pending)
- Accounts: Account A = Android chat; Account B = web chat
- Offline symptoms: "no internet connection" + "chat connection failed"
- Reconnect after online: Working

### QA Result

**PASS**

- Bidirectional realtime while online: works
- Offline: explicit no-internet + chat connection failed
- After network restored: reconnect and messaging work

---

## Scenario R4 — Live Sync Refresh

**Module:** Regression  
**Owner:** Tirth  
**Status:** BLOCKED  
**Priority:** High  
**Platform:** Production Android APK

### Preconditions

- Two devices/clients logged in.
- Accounts must be in a state where a **new** interest/request and/or invitation can still be generated.

### Manual Test Steps

1. Keep Account A open on the Explore/Dashboard screen.
2. From Account B, send a match interest or a group invitation.
3. Observe Account A's client.
4. Verify if the invitation or match updates dynamically without having to pull-to-refresh or restart the app.

### Expected Result

Realtime sync events update the local client state instantly without manual user action.

### Actual Result

FAIL — After resetting the database state and sending a new match interest / group invitation from Account B (web), the updates did not appear dynamically on Account A's mobile screen (regardless of whether the app was active, open, or closed). No push notifications were delivered in either case. Furthermore, on the requests screen, neither the interests nor the invitations update correctly or dynamically, even after triggering a manual refresh/reload.

### Evidence

- Screenshot: N/A
- Screen recording: N/A
- Timestamp: 2026-08-27T22:05:00Z
- Device: Physical Android (Tirth)
- APK version/build: Latest production APK (exact build string pending)

### Failure Details

**Reproduction Steps**

1. Reset the invite/relationship states in the database.
2. Observe Account A on the mobile client (across active open, background, and closed states).
3. Send a new match interest and a group invitation from Account B (web).
4. Observe whether the mobile client receives push notifications.
5. Navigate to the Requests screen on Account A.
6. Verify if the incoming requests update dynamically, or if they appear after manual refresh/reload.

**Expected Behavior**

Real-time sync events should instantly update the UI of the receiving client to reflect new invitations or matching interests without manual refreshes. Corresponding push notifications should be delivered when the app is active, backgrounded, or closed. The requests screen should update correctly and reflect the new states dynamically or upon manual refresh.

**Actual Behavior**

- Dynamic updates fail completely on the mobile client under all app states (active open, background, closed).
- Push notifications do not arrive for either match interests or group invitations in any state.
- The Requests screen fails to display new incoming interests and invitations dynamically, and they do not populate or update correctly even after triggering a manual refresh/reload.

**Affected Platform**

Production Android APK

**Severity**

High

**Evidence**

- Screenshot: N/A
- Screen recording: N/A
- Timestamp: 2026-08-27T22:05:00Z
- Relevant logs: N/A

**Backend Impact**

Suspected (Realtime sync dispatcher / Socket event broadcasting or mobile event listener registration failure).

**Bug ID**

Pending reconciliation

### QA Result

**FAIL**
