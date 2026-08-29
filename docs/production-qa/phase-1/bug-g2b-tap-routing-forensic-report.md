# BUG-G2b Follow-Up — Notification Tap Routing Forensic Report

> **Status:** FORENSIC COMPLETE — NO APPLICATION SOURCE CODE MODIFIED  
> **Date:** 2026-08-29  
> **Scope:** `GROUP_JOIN_REQUEST_RECEIVED` notification tap destination only (Test G Scenarios 3–4 UX defect)  
> **Parent:** BUG-G2b delivery — **VERIFIED PASS (closed)** — this is a **separate follow-up task**

---

## A. Executive Summary

| | Current behavior | Desired behavior |
| :--- | :--- | :--- |
| **S3 — Background tap** | Notification delivers; tap opens correct group at **Group Overview** (tab 0) | Same delivery; tap opens **Settings tab** and **Join Requests sheet** |
| **S4 — Cold-start tap** | Same as S3 | Same as desired S3 |

**Delivery is not broken.** Notification creation, socket/FCM delivery, and Join Requests data sync all pass Test G. The defect is purely **post-tap navigation**: mobile routes all `entity_type=group` taps to `/groups/{groupId}` with default tab 0, ignoring that the notification `type` is `GROUP_JOIN_REQUEST_RECEIVED`.

**First failed stage (code-proven):** `router.dart` FCM tap handler — `case 'group'` branch — pushes `/groups/$entityId` without reading `data['type']` and without selecting Settings or presenting `JoinRequestsSheet`.

**Web parity exists:** `apps/web/src/shared/utils/notificationHelpers.ts` already routes `GROUP_JOIN_REQUEST_RECEIVED` to a join-requests-specific destination. Mobile has no equivalent branch.

---

## B. Exact Notification Tap Flow

### End-to-end (background / cold-start — Scenarios 3–4)

```text
Account B → POST join-request
  → createNotification(GROUP_JOIN_REQUEST_RECEIVED, entity_type=group, entity_id=groupId)
  → evaluatePushNotifications → PushService.sendPush (when FCM not suppressed)
  → FCM data payload:
       { type, entity_type, entity_id, notificationId, url, ... }
  → Android system tray notification

Account A taps notification
  ↓
[Path A — Background] FirebaseMessaging.onMessageOpenedApp
[Path B — Cold start]   FirebaseMessaging.getInitialMessage (+ 500ms delay)
  ↓
FCMService._handleNotificationTap(RemoteMessage)
  → _tapBroadcast.emit({ ...message.data, __foreground: false })
  ↓
router.dart — FCMService.onNotificationEvent listener
  → skips if __foreground == true
  → reads entity_type, entity_id only (NOT type)
  → switch(entity_type) → case 'group'
  → router.push('/groups/$entityId')          ← STOP: Overview tab, no sheet
  ↓
GroupDetailsRouteData.buildPage
  → parses ?tab= (absent → initialTabIndex = 0)
  ↓
GroupDetailsScreen
  → IndexedStack index 0 = OverviewTab
  → JoinRequestsSheet NOT presented
```

### Foreground local-notification tap (Scenario 2 tray tap — same routing defect)

When FCM is suppressed (socket online), `NotificationRealtimeBridge` shows a local notification via `FCMService.showLocalNotification()`. Tap path:

```text
flutter_local_notifications onDidReceiveNotificationResponse
  → jsonDecode(response.payload)
  → _tapBroadcast.emit({ ...data, __foreground: false })
  → same router.dart handler → /groups/{id} Overview
```

Payload built by `buildJoinRequestLocalNotification()` **includes** `type: GROUP_JOIN_REQUEST_RECEIVED` — but router still ignores it.

### Paths that do NOT perform tap routing

| Source | Behavior |
| :--- | :--- |
| `FirebaseMessaging.onMessage` (foreground FCM receive) | Shows local notification; emits `__foreground: true` — **router skips** |
| `NotificationRealtimeBridge._onFcmEvent` | Provider refresh / invalidation only — **no navigation** |
| In-app Notifications screen tap | `notifications_screen.dart` — mark-as-read only — **no navigation** |

---

## C. Payload

### Backend FCM data (code-proven)

From `notifyGroupJoinRequestRecipients.ts` → `createNotification()`:

| Field | Value |
| :--- | :--- |
| `type` | `GROUP_JOIN_REQUEST_RECEIVED` |
| `entity_type` | `group` |
| `entity_id` | `{groupId}` |
| `title` | `"Join Request"` |
| `message` | `"{requesterName} wants to join {groupName}"` |
| `data.senderId` / `data.actorId` | requester UUID |

From `PushService.sendPush()` (lines 95–100), every FCM `data` map includes:

```json
{
  "type": "GROUP_JOIN_REQUEST_RECEIVED",
  "entity_type": "group",
  "entity_id": "<groupId>",
  "notificationId": "<uuid>",
  "url": "/groups/<groupId>",
  "senderId": "<requesterUuid>",
  "actorId": "<requesterUuid>"
}
```

**Note:** `url` is generic group overview (`getNotificationLink` in `pushService.ts` line 230). Mobile router **does not read `url`** — only `entity_type` / `entity_id`.

### Socket / local-notification payload (Scenario 2 tray)

From `buildJoinRequestLocalNotification()` (`inbound_notification_event.dart` lines 160–171):

```json
{
  "type": "GROUP_JOIN_REQUEST_RECEIVED",
  "entity_type": "group",
  "entity_id": "<groupId>",
  "id": "<notificationId>",
  "notificationId": "<notificationId>"
}
```

### Sufficiency for routing

**Yes.** The payload already contains everything needed:

- `entity_id` → group ID
- `type` → discriminates join-request from other group notifications (invites, etc.)

No backend payload change is required for a minimal mobile fix.

---

## D. First Failed Stage

**File:** `apps/mobile/lib/core/navigation/router.dart`  
**Function:** `FCMService.onNotificationEvent.listen` callback (lines 84–145)  
**Branch:** `case 'group':` (lines 120–121)

```dart
case 'group':
  if (entityId != null) router.push('/groups/$entityId');
```

At this point:

- `data['type']` **is present** on the map (preserved by `_handleNotificationTap` and local-notification payload decode).
- The handler **never reads** `data['type']`.
- Route constructed is `/groups/{groupId}` with **no** `tab=3` and **no** sheet trigger.
- `GroupDetailsScreen` initializes `_activeTabIndex` from `initialTabIndex`, default **0** (Overview).

This is the **first** code point where join-request-specific destination is lost. Upstream tap handlers faithfully forward the full data map.

---

## E. Root Cause

Mobile notification tap routing uses **`entity_type` alone** as the routing key. All group-scoped notifications share one destination: group overview.

### Evidence chain

1. **`FCMService._handleNotificationTap`** (lines 363–367) emits the complete `message.data` including `type` — no information loss.

2. **`router.dart`** (lines 89–90) extracts only `entity_type` and `entity_id`:
   ```dart
   final entityType = data['entity_type'] as String?;
   final entityId = data['entity_id'] as String?;
   ```

3. **`case 'group'`** unconditionally routes to overview — no `type` switch.

4. **Precedent for type-aware routing exists in the same file** — `case 'match':` reads `data['type']` for `MATCH_ACCEPTED` and routes to chat instead of `/requests` (lines 122–134). Join requests were never given equivalent treatment.

5. **Web client has the intended behavior** — `notificationHelpers.ts` lines 29–35:
   ```typescript
   case "group":
     if (type === NotificationType.GROUP_JOIN_REQUEST_RECEIVED) {
       return `/groups/${entity_id}/settings?tab=requests`;
     }
   ```
   Mobile was never aligned with this pattern.

6. **`inbound_notification_event.dart`** parses `type` for realtime dispatch but is **not used** by the tap router — it serves `NotificationRealtimeBridge` only.

### Why current behavior occurs

Join-request notifications use `entity_type: "group"` (correct for entity association). The mobile router treats every group entity tap identically. There is no second step to open Settings (tab 3) or present `JoinRequestsSheet` (modal bottom sheet).

---

## F. Background Flow

| Step | Component | Finding |
| :--- | :--- | :--- |
| 1 | User backgrounds app | Socket may disconnect (`BackgroundGovernor`); FCM delivers when eligible |
| 2 | User taps tray notification | `onMessageOpenedApp` fires |
| 3 | `_handleNotificationTap` | Emits full data + `__foreground: false` |
| 4 | Router listener | Routes to `/groups/{id}` — Overview |
| 5 | `GroupDetailsScreen` | Tab 0; no sheet |

**Convergence:** Same router function as cold-start and local-notification taps.

---

## G. Cold-Start Flow

| Step | Component | Finding |
| :--- | :--- | :--- |
| 1 | App terminated | No socket; FCM delivers |
| 2 | User taps notification | App launches |
| 3 | `FCMService.init()` | `getInitialMessage()` returns message |
| 4 | 500ms delay | Allows router mount (`fcm_service.dart` lines 146–149) |
| 5 | `_handleNotificationTap` | Same emit as background |
| 6 | Router listener | Same `/groups/{id}` — Overview |

**Difference from background:** Only the 500ms initialization delay. Routing logic is identical — **one fix covers both**.

---

## H. Join Requests Presentation

### Widget

`JoinRequestsSheet` — `apps/mobile/lib/features/groups/widgets/management_sheets.dart` (lines 172+)

- **Type:** `ConsumerStatefulWidget` inside `SettingsBottomSheet`
- **Requires:** `GroupModel group` (full group object, not just ID)
- **Data:** `joinRequestsProvider(group.id)` — already invalidated by bridge on receive
- **Actions:** Approve/reject via `groupActionsProvider` (G2 mutation — **do not modify**)

### Manual open path (working reference)

```text
GroupDetailsScreen (member/admin)
  → User selects Settings tab (index 3)
  → SettingsTab
  → KovariListRow "Join Requests" (admin/creator only)
  → _showEditSheet(context, JoinRequestsSheet(group: group))
  → showModalBottomSheet(isScrollControlled: true, ...)
```

**Call sites:** Only `settings_tab.dart` line 95.

### Programmatic open requirements

1. Navigate to group screen with **Settings tab selected** (`tab=3` — already supported by `GroupDetailsRouteData`).
2. Wait until `GroupModel` and membership are loaded (screen already gates on `groupState.hasData` and membership).
3. Verify admin/creator (same condition as Settings list row).
4. Call `showModalBottomSheet` with `JoinRequestsSheet(group: group)` — mirror `_showEditSheet` in `settings_tab.dart`.

### Existing deep-link capability

`GroupDetailsRouteData` (`routes.dart` lines 151–158):

```dart
final tabStr = state.uri.queryParameters['tab'];
final initialTab = tabStr != null ? int.tryParse(tabStr) ?? 0 : 0;
// → GroupDetailsScreen(groupId: groupId, initialTabIndex: initialTab)
```

Tab indices (`group_tab_bar.dart` line 17): `['Overview', 'Chats', 'Itinerary', 'Settings']` → Settings = **3**.

**No existing `sheet=` or `initialSheet` query parameter** anywhere in the mobile codebase. Sheet auto-open would be a small, localized addition to `GroupDetailsScreen` (or route parser), not a new navigation abstraction.

---

## I. Authorization

### Who receives join-request notifications

`resolveGroupJoinRequestRecipientIds()` — group **creator** + **accepted admins** only (server-side). Normal members never receive this notification type.

### Who can open Join Requests in UI

`settings_tab.dart` lines 88–96:

```dart
if (membershipState?.data?.isAdmin == true ||
    membershipState?.data?.isCreator == true)
  KovariListRow(label: 'Join Requests', ...)
```

`JoinRequestsSheet` itself does **not** re-check permissions — it assumes the caller gated access.

### Safe routing requirements for fix

| Case | Expected behavior |
| :--- | :--- |
| Admin/creator taps notification | Settings tab + Join Requests sheet |
| User demoted since notification | Open group Settings tab; **do not** auto-open sheet (no permission) |
| Group deleted | Existing error/skeleton states in `GroupDetailsScreen` |
| Request already accepted/rejected | Sheet opens; shows "No pending requests." (acceptable) |
| Non-member somehow receives stale notification | `_buildJoinState` or partial state — sheet must not bypass membership gate |

**Do not weaken authorization.** Auto-present sheet only when `membership.isAdmin || membership.isCreator` after membership loads.

---

## J. Regression Impact

### Must remain unchanged

| Notification / route | Current mobile tap destination | Action |
| :--- | :--- | :--- |
| `NEW_MESSAGE` (direct) | `/chat/{chatId}` | No change |
| `NEW_MESSAGE` (group chat) | `/groups/{id}?tab=1` | No change |
| `MATCH_ACCEPTED` | `/chat/{directChatId}` | No change |
| `MATCH_INTEREST_RECEIVED` | `/requests` | No change |
| `GROUP_INVITE_RECEIVED` | `/groups/{id}` Overview | No change |
| `GROUP_JOIN_APPROVED` | `/groups/{id}` Overview | No change |
| Generic / unknown `entity_type` | `/notifications` | No change |

### Only special-case

```text
type == GROUP_JOIN_REQUEST_RECEIVED && entity_type == group
```

### Protected systems (explicit)

- `shouldSendPush.ts` / FCM suppression
- Redis / Socket.IO notification pipeline
- `NotificationRealtimeBridge`
- `group_details_provider.dart` / G2 mutations
- Chat notification handling
- Backend join-request creation

---

## K. Minimal Fix Proposal

Follow existing patterns; mirror web type-discrimination and mobile chat group tab routing.

### Step 1 — Router type branch (`router.dart`)

When `entity_type == 'group'` **and** `data['type'] == 'GROUP_JOIN_REQUEST_RECEIVED'`:

```dart
router.push('/groups/$entityId?tab=3&sheet=joinRequests');
```

All other `entity_type == 'group'` taps keep:

```dart
router.push('/groups/$entityId');
```

Pattern matches existing `MATCH_ACCEPTED` type check in `case 'match'`.

### Step 2 — Parse `sheet` query param (`routes.dart`)

Extend `GroupDetailsRouteData.buildPage`:

```dart
final sheet = state.uri.queryParameters['sheet'];
// pass initialSheet: sheet to GroupDetailsScreen
```

Reuse existing `tab` parsing — no new navigation framework.

### Step 3 — Auto-present sheet (`group_details_screen.dart`)

After group + membership data available and main member UI renders:

- If `initialSheet == 'joinRequests'` **and** `(membership.isAdmin || membership.isCreator)`:
  - `WidgetsBinding.instance.addPostFrameCallback` → `showModalBottomSheet` with `JoinRequestsSheet(group: group)`
  - Same modal config as `SettingsTab._showEditSheet` (transparent, scrollControlled)
- If not authorized: land on Settings tab only (user sees no Join Requests row — acceptable fallback)
- Guard with one-shot flag to avoid re-opening on rebuild

### Step 4 — Optional DRY

Extract `_showJoinRequestsSheet(BuildContext, GroupModel)` shared by `SettingsTab` and `GroupDetailsScreen` — **optional**, not required for minimal fix.

### What this fix does NOT do

- No backend / payload changes
- No `NotificationRealtimeBridge` changes
- No new notification listeners
- No changes to FCM delivery or suppression

---

## L. Files Proposed for Modification (implementation phase only)

| File | Change |
| :--- | :--- |
| `apps/mobile/lib/core/navigation/router.dart` | Type-aware branch for `GROUP_JOIN_REQUEST_RECEIVED` |
| `apps/mobile/lib/core/navigation/routes.dart` | Parse `sheet` query param; pass to screen |
| `apps/mobile/lib/features/groups/screens/group_details_screen.dart` | Honor `initialSheet`; present `JoinRequestsSheet` when authorized |
| `apps/mobile/test/...` (new) | Unit/widget tests for routing decision and sheet gate |

**Optional:** `settings_tab.dart` — extract shared sheet helper (cosmetic DRY only).

---

## M. Files Explicitly Protected

Do **not** modify in the tap-routing fix:

```text
apps/mobile/lib/core/notifications/notification_realtime_bridge.dart
apps/mobile/lib/core/notifications/inbound_notification_event.dart   (unless tests only)
apps/mobile/lib/core/services/fcm_service.dart                        (delivery behavior)
apps/mobile/lib/features/groups/providers/group_details_provider.dart
apps/web/src/services/notifications/shouldSendPush.ts
apps/web/src/services/notifications/pushService.ts
apps/web/src/services/socket/**                                     (notification fan-out)
apps/web/src/lib/notifications/createNotification.ts
apps/web/src/lib/notifications/notifyGroupJoinRequestRecipients.ts
Chat notification paths (ConversationRuntimeStore, chat router branches)
BUG-G2 mutation paths (approve/reject/remove/leave/join)
```

---

## N. Test Plan (implementation phase)

| # | Test | Expected |
| :--- | :--- | :--- |
| 1 | Background tap — `GROUP_JOIN_REQUEST_RECEIVED` | `/groups/{id}?tab=3&sheet=joinRequests`; sheet visible |
| 2 | Cold-start tap — same payload | Same destination after init delay |
| 3 | Correct `entity_id` | Opens intended group, not another |
| 4 | Admin/creator recipient | Join Requests sheet auto-opens |
| 5 | `GROUP_INVITE_RECEIVED` (`entity_type=group`) | Still opens Overview (tab 0), no sheet |
| 6 | `GROUP_JOIN_APPROVED` | Still opens Overview |
| 7 | Demoted admin (no longer admin) | Settings tab opens; sheet **not** auto-presented |
| 8 | G2 Tests A–F regression | PASS — mutation paths untouched |
| 9 | Chat `NEW_MESSAGE` tap routing | Unchanged |
| 10 | Foreground local-notification tap (S2 tray) | Same join-requests destination (bonus parity) |

**Suggested test approach:** Extract routing URL builder from `router.dart` into a pure function (like `dispatchInboundNotification`) and unit-test without full GoRouter widget tree. Widget test for `GroupDetailsScreen` sheet gate with mocked membership.

---

## O. Manual vs Notification Navigation Comparison

```text
MANUAL (working):
  GroupDetailsScreen
    → user taps Settings tab (index 3)
    → SettingsTab
    → "Join Requests" row (admin/creator gate)
    → showModalBottomSheet(JoinRequestsSheet)

NOTIFICATION (defect):
  Tap
    → FCMService._handleNotificationTap
    → router: case 'group' → /groups/{id}        [missing: tab=3, sheet trigger]
    → GroupDetailsScreen tab 0 (Overview)
    → JoinRequestsSheet never presented

MISSING TRANSITIONS (proven):
  1. Router does not read notification `type`
  2. Route does not include tab=3 (Settings)
  3. No sheet presentation trigger after navigation
```

---

## P. Investigation Artifacts

### Tap source matrix

| # | Source | Entry point | Reaches router? | Routes on tap? |
| :--- | :--- | :--- | :--- | :--- |
| 1 | FCM background tap | `onMessageOpenedApp` → `_handleNotificationTap` | Yes | Yes |
| 2 | FCM cold-start tap | `getInitialMessage` → `_handleNotificationTap` | Yes | Yes |
| 3 | Local notification tap | `onDidReceiveNotificationResponse` | Yes | Yes |
| 4 | FCM foreground receive | `onMessage` → `__foreground: true` | Yes | **No** (by design) |
| 5 | Socket realtime | `NotificationRealtimeBridge` | N/A | No |

### Dual listeners on `onNotificationEvent`

| Listener | File | Purpose |
| :--- | :--- | :--- |
| Router | `router.dart` | Tap routing (`__foreground == false` only) |
| Bridge | `notification_realtime_bridge.dart` | Provider refresh |

No duplicate routing listeners. Fix should **not** add a third listener — extend existing router branch only.

---

## Q. Git Safety Confirmation

**Before investigation:**

```
On branch dev
nothing to commit, working tree clean
```

**After investigation:** Only this forensic report file added. No application source modifications.

---

## R. Final Output Summary

| Item | Result |
| :--- | :--- |
| **1. First failed routing stage** | `router.dart` `case 'group'` — ignores `type`, pushes `/groups/{id}` default Overview |
| **2. Root cause** | Entity-type-only routing; no mobile parity with web `notificationHelpers` join-request branch; no tab/sheet deep-link for join requests |
| **3. Affected files (fix)** | `router.dart`, `routes.dart`, `group_details_screen.dart` (+ tests) |
| **4. Minimal fix** | Type branch → `/groups/{id}?tab=3&sheet=joinRequests` → authorized auto-present `JoinRequestsSheet` |
| **5. Background vs cold-start** | Identical router path; cold-start adds 500ms mount delay only |
| **6. Authorization** | Gate sheet on `isAdmin \|\| isCreator`; server already limits recipients |
| **7. Regression risks** | Low if branch is strictly `GROUP_JOIN_REQUEST_RECEIVED`; other group types unchanged |
| **8. Implementation plan** | Router branch → route param → screen post-frame sheet; no delivery/bridge changes |
| **9. Source code modified** | **None** — forensic report only |

---

**STOP.** Await explicit approval before implementation.

**Suggested tracker ID:** `BUG-G2b-TAP` or `BUG-G2c` (narrow UX scope — not a reopen of BUG-G2b delivery).

---

## S. Implementation & Validation (2026-08-29)

> **Status:** IMPLEMENTED — **pending physical-device QA sign-off**

### Implementation summary

| Item | Detail |
| :--- | :--- |
| **Bug ID** | `BUG-G2b-TAP` (separate from closed BUG-G2b delivery) |
| **Change type** | Mobile-only navigation / sheet presentation |
| **Delivery stack** | **Untouched** |

### Files modified

| File | Change |
| :--- | :--- |
| `apps/mobile/lib/core/navigation/router.dart` | `resolveGroupNotificationTapRoute()` + type-aware `case 'group'` branch |
| `apps/mobile/lib/core/navigation/routes.dart` | Parse `?sheet=` query param; pass `initialSheet` to screen |
| `apps/mobile/lib/features/groups/screens/group_details_screen.dart` | Auto-present `JoinRequestsSheet` with admin/creator gate + one-shot guard |
| `apps/mobile/test/runtime/notification_tap_routing_test.dart` | **New** — 10 routing/authorization unit tests |

### Protected systems (verified unchanged)

- `notification_realtime_bridge.dart`, `inbound_notification_event.dart`, `fcm_service.dart`
- `group_details_provider.dart`, all G2 mutation paths
- Backend / web notification delivery

### Automated validation

| Command | Result |
| :--- | :--- |
| `flutter test test/runtime/notification_tap_routing_test.dart` | **10/10 PASS** |
| `flutter test` (full suite) | **53/53 PASS** |
| `flutter analyze lib` | Pre-existing info/warnings only; no new errors from this change |

### Manual production QA

| Scenario | Status |
| :--- | :--- |
| S1 — Background tap → Settings + Join Requests sheet | **PENDING** |
| S2 — Cold-start tap | **PENDING** |
| S3 — Foreground local notification tap | **PENDING** |
| S4 — Normal group notification → Overview | **PENDING** |
| S5 — Demoted admin → no sheet | **PENDING** |
| S6 — BUG-G2 regression (Tests A–F) | **PENDING** |
| S7 — Chat notification routing | **PENDING** |

### APK

Release APK build and physical-device install — **PENDING**.

### Final status

**OPEN — awaiting physical-device QA sign-off.** Do not mark `VERIFIED PASS` until manual Scenarios 1–7 complete on production APK.

See also: `docs/production-qa/phase-1/bug-g2b-tap-routing-fix-validation.md`

