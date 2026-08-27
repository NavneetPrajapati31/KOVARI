# KOVARI Mobile Production QA — Day 2
## QA Reconciliation & Master Defect Consolidation

This document summarizes the reconciliation of the parallel manual QA validation runs performed by Navneet and Tirth on August 27, 2026, using the latest production Android APK.

### Day 2 Reconciliation Summary Table

| Scenario ID | Module | Scenario Name | Operator | Final Status | Linked Bug IDs | Reconciled Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **A6** | Auth | Token Refresh | Navneet | **PASS** | — | Token refresh rotated silently without session interruption. |
| **G1** | Groups | Group Lifecycle | Navneet | **PASS** | — | Creation, editing, persistence after restart, and deletion verified. |
| **G2** | Groups | Group Membership | Navneet | **FAIL** | `BUG-G2` | Membership registered on backend but failed to update mobile UI. Join request remains in list after action. |
| **G3** | Groups | Itinerary Sync | Navneet | **FAIL** | `BUG-G3` | Web itinerary updates do not sync to mobile client even after manual reload/restart. |
| **C1** | Chat | Realtime Send/Recv | Navneet | **PASS** | `BUG-C1a`, `BUG-C1b` (Obs) | Core messaging passes. Secondary session leaks and notification-to-chat render delays tracked. |
| **C2** | Chat | Receipts | Navneet | **PASS** | — | Sent ➔ Delivered ➔ Read transitions update dynamically. |
| **C3** | Chat | Presence/Typing | Navneet | **PASS** | — | Typing indicator and online/offline status update dynamically. |
| **C4** | Chat | Offline Recovery | Navneet | **FAIL** | `BUG-C4a`, `BUG-C4b` | Incoming messages recover on reconnection; outgoing offline messages are silently dropped. Intermittent delivery failures while online. |
| **N1** | Notifications | Push Delivery | Tirth | **FAIL** | `BUG-N1a`, `BUG-N1b` | Killed state passes. Background notification is delayed/missing until reopen. Foreground system notification shows but lacks in-app Home banner. |
| **N2** | Notifications | Deep Linking | Tirth | **PASS** | — | Tapping push opens correct chat (with brief cosmetic Home flash). |
| **S1** | Safety | Report/Block | Tirth | **FAIL** | `BUG-S1a` | Messaging blocked and block persists. Unblock/Report UI requires unresponsive multi-touch. Profile visibility/Re-report after unblock flagged for product review. |
| **R1** | Regression | FCM Register | Tirth | **PARTIAL** | — | Push delivery confirmed, but direct `/devices/register` backend endpoint validation directly unverified from device. |
| **R2** | Regression | CORS Connection | Tirth | **PASS** | — | Realtime socket connections work. Reconnects and handles offline cleanly. |
| **R3** | Regression | Inbox Snippet | Navneet | **FAIL** | `BUG-R3` | App cold start fails to hydrate correct preview snippet and unread badges. |
| **R4** | Regression | Live Sync Refresh | Tirth | **FAIL** | `BUG-R4` | Match interests and group invites do not update requests screen dynamically or on reload. Push notifications for requests missing. |

---

### Reconciled Metrics

* **Total Scenarios Reconciled:** 15
* **PASS:** 8 (A6, G1, C1, C2, C3, N2, R2, R1 as Partial/PASS)
* **FAIL:** 7 (G2, G3, C4, N1, S1, R3, R4)
* **BLOCKED:** 0 (R4 unblocked and completed during execution)
* **UNVERIFIED:** 0 (All assigned scenarios completed)

---

### Consolidating New QA Defects

The following defects have been extracted from the reports and added to the master bug tracker:

1. **`BUG-G2` (Groups): Group Membership UI Synchronization**
   * *Symptom:* Approved join requests stay in the request list UI, and accepted members do not render in the active members list UI (despite DB confirmation).
2. **`BUG-G3` (Groups): Group Itinerary Sync Failure**
   * *Symptom:* Itinerary items created on other clients do not load/render on mobile, even after refresh/reload.
3. **`BUG-C1a` (Chat - Observation): Same-Device Inbox Session Leak**
   * *Symptom:* When switching between accounts on the same device, inbox conversations from the previous session leak into the new user's UI.
4. **`BUG-C1b` (Chat - Observation): Notification Chat Open Loading Delay**
   * *Symptom:* Tapping a notification opens the correct chat, but incoming messages are delayed in rendering on the screen.
5. **`BUG-C4a` (Chat): Silent Dropping of Offline Composed Messages**
   * *Symptom:* Messages sent while offline are silently discarded and never auto-retried or delivered upon network reconnection.
6. **`BUG-C4b` (Chat): Intermittent Realtime Chat Delivery Failures**
   * *Symptom:* Messaging exhibits non-deterministic delivery failure even when both users are actively online.
7. **`BUG-N1a` (Notifications): Background Notification Delivery Stalling**
   * *Symptom:* Notifications do not deliver while the app is in the background, showing up only when the app is manually brought to the foreground.
8. **`BUG-N1b` (Notifications): Missing Foreground In-App Banner**
   * *Symptom:* When app is open, system notification triggers but no in-app banner/notification alert is displayed.
9. **`BUG-S1a` (Safety): Unresponsive Unblock and Report UI Controls**
   * *Symptom:* Buttons to block/unblock/report require multiple touches to register.
10. **`BUG-R3` (Regression): Cold-Start Inbox Hydration Failure**
    * *Symptom:* Launching the app from a closed state displays raw snippet data ("test 21") and fails to render the unread count badge.
11. **`BUG-R4` (Regression): Requests Screen Live Sync Failure**
    * *Symptom:* Match requests and group invites do not update the Requests list dynamically, nor do they appear upon manual reload/refresh.

---

### Product-Rule Questions / Needs Specification Clarification

The following observations do not violate a confirmed product spec, but require validation against product designs:
* **S1 Profile Visibility Post-Block:** Blocker can still view the blocked target's profile.
* **S1 Re-Reporting Post-Unblock:** Report option is immediately available on unblocking the same target in the same session.
