# BUG-G2b Production Forensic Investigation

> **Status:** FORENSIC COMPLETE — ROOT CAUSE IDENTIFIED FROM CODE; PRODUCTION RUNTIME EVIDENCE STILL REQUIRED FOR DEPLOYMENT CONFIRMATION  
> **Date:** 2026-08-29  
> **Constraint:** No application source code was modified during this investigation.

---

## 1. Executive Summary

Human QA Test G (Account A = production Android, Account B = production web) failed Scenarios 1–4 after commits `e9ad6bf8` (backend) and `d8029436` (mobile bridge). Scenarios 5–6 (BUG-G2 mutation + chat) **PASS**.

**Proven from current code (not a guess):** the realtime socket fan-out for `GROUP_JOIN_REQUEST_RECEIVED` addresses the wrong Socket.IO room for mobile clients.

| Client | Socket auth `userId` / room | Notification emit target |
| :--- | :--- | :--- |
| Web | Clerk id → `user_socket:{clerkId}` | `user_socket:{clerkUserId}` |
| Mobile | JWT `sub` = **Supabase UUID** → `user_socket:{uuid}` | `user_socket:{clerkUserId}` only |

Chat still works because messages are delivered via `join_chat` rooms (`receive_message`), not `user_socket` `new_notification`. That matches QA Scenario 6 PASS.

**Secondary proven black hole:** if the recipient has **no** `clerk_user_id`, `createNotification()` skips Redis emit (`if (clerkId)`), while `shouldSendPush()` may treat the mobile user as **online** (presence key = UUID) and **suppress FCM** because `GROUP_JOIN_REQUEST_RECEIVED` is in `REALTIME_SOCKET_DELIVERED_TYPES`. Result: **no socket and no FCM**.

**Deployment:** both fix commits **are on `origin/master`**. Whether Vercel, Render, and the **physical APK** actually run those commits is **UNKNOWN** without dashboard/APK metadata. Git presence ≠ runtime.

**BUG-G2b remains OPEN. Not VERIFIED PASS.**

```text
Is e9ad6bf8 deployed to production backend?     UNKNOWN
Is d8029436 included in the APK under test?     UNKNOWN
Is production socket running emitRealtimeNotification subscriber?  UNKNOWN
```

---

## 2. Current Git / Deployment State

### Repository (this investigation)

| Item | Value |
| :--- | :--- |
| Branch | `dev` (tracks `origin/dev`, clean working tree) |
| `e9ad6bf8` | Present in `HEAD`, `origin/dev`, **and `origin/master`** |
| `d8029436` | Present in `HEAD`, `origin/dev`, **and `origin/master`** |
| Later commit | `b391f2aa` docs-only — on `origin/dev`, **not** on `origin/master` |
| Uncommitted changes | None |

### How production is defined in this repo

From [`bug-c4b-production-deployment-checklist.md`](file:///c:/Users/navne/CSE/DEV/KOVARI/docs/production-qa/phase-1/bug-c4b-production-deployment-checklist.md):

- **Production git branch:** `master`
- **Web:** Vercel (`app.kovari.in`)
- **Socket:** Render (`socket.kovari.in` / `kovari-socket.onrender.com`)

`vercel.json` in-repo is empty `{}`. No GitHub Actions deploy workflow. **No live Vercel/Render commit SHA is available from this environment** (`gh` CLI not installed; no production log access).

### Deployment answers

```text
Is e9ad6bf8 deployed to production backend?
UNKNOWN

Evidence present: commit is on origin/master (the documented production branch).
Evidence missing: Vercel deployment SHA for app.kovari.in at QA timestamp.

Is d8029436 included in the APK currently being tested?
UNKNOWN

Evidence present: commit is on origin/master and origin/dev.
Evidence missing: APK versionCode / build date / git SHA. Flutter APKs are not
auto-built from git. pubspec.yaml is still version 1.0.0+1 (no unique build stamp).
QA Scenario 5 PASS is consistent with an APK that already contained BUG-G2 (73d3dd3d)
even if it does NOT contain d8029436.

Is the production socket server running the code containing emitRealtimeNotification?
UNKNOWN

Evidence present: subscriber lives in apps/web/src/services/socket/server.ts
and is in origin/master.
Evidence missing: Render deploy SHA / restart time. Socket process is a separate
service from Vercel. Chat PASS does not prove the new Redis subscriber is live —
chat does not use this subscriber.
```

---

## 3. Backend Trace

```text
Account B (web)
  ↓
POST /api/groups/[groupId]/join-request
  ↓
pending_request write (new insert OR declined→pending)
  ↓
notifyGroupJoinRequestRecipients(groupId, requesterUuid)
  ↓
createNotification({ type: GROUP_JOIN_REQUEST_RECEIVED, entityType: "group", entityId: groupId })
  ↓
notifications table insert (user_id = recipient Supabase UUID)
  ↓
after() → emitRealtimeNotification + evaluatePushNotifications
```

### Join-request paths (both notify)

1. **New insert** of `pending_request` — calls `notifyGroupJoinRequestRecipients` after success.
2. **Declined → pending_request** update — same call after success.
3. **Already pending / already member / pending invite** — **400, no notification** (correct).

Notification failures are **caught and logged**; HTTP still returns success. Duplicate pending requests do not create extra notifications.

### Recipients (server-side)

`resolveGroupJoinRequestRecipientIds`:

- Group `creator_id` (if not requester)
- Accepted memberships with `role = "admin"`
- Deduped set of Supabase UUIDs

`createNotification` payload:

- `type`: `GROUP_JOIN_REQUEST_RECEIVED`
- `entityType`: `"group"`
- `entityId`: `groupId`
- `data.senderId` / `actorId`: requester UUID

### Side effects

DB insert is **awaited**. Redis emit and FCM run in Next.js `after()`. If `after()` does not run on the production Vercel runtime, **DB row can exist with zero delivery**. This is not proven; it is a runtime check.

If recipient `clerk_user_id` is null, Redis emit is **skipped entirely**.

---

## 4. Redis / Socket Trace

```text
createNotification after()
  ↓
emitRealtimeNotification()
  ↓
pubClient.publish("notifications:new_notification", JSON)
  ↓
Socket server subClient.subscribe(NOTIFICATION_SOCKET_CHANNEL)
  ↓
io.to(`user_socket:${payload.clerkUserId}`).emit("new_notification", {..., entity_type, entity_id})
```

Channel constant: `packages/api/src/notifications/constants.ts`  
`NOTIFICATION_SOCKET_CHANNEL = "notifications:new_notification"`

Publisher (Next.js) and subscriber (Render socket) **must share the same Redis**. Chat does **not** use this channel.

### Comparison with known-good ban pattern

Ban handler emits to **both** `payload.clerkUserId` **and** `payload.userId`:

```text
keys = [clerkUserId, userId]
io.in(`user_socket:${key}`)
```

Notification subscriber emits **only** `user_socket:${clerkUserId}`.

Mobile socket join (`server.ts`):

```text
verifiedUserId = JWT payload.sub   // UUIDv4 for mobile (jwt.ts comment: sub: userId (UUID))
socket.join(`user_socket:${userId}`)
PresenceManager.userConnected(userId, socket.id)  // Redis set user_socket:{UUID}
```

Web socket join (`getSocket(clerkUserId)`): `user_socket:{clerkId}`.

**This is a contract mismatch, not a payload-field mismatch.** Payload fields `entity_type` / `entity_id` are correct for the mobile parser **if the event arrives**.

`presenceKeyForSupabaseUserId` even documents: presence keys use Clerk when present, **otherwise internal UUID (mobile)**.

---

## 5. Mobile Receiver Trace

```text
SocketService._setupListeners
  → on('new_notification') → SocketEvent stream
  ↓
RealtimeEventPipeline (chatId null → immediate flush)
  ↓
NotificationRealtimeBridge._onSocketEvent  (if APK includes d8029436)
  ↓
InboundNotificationEvent.tryParse
  → type, entity_type, entity_id
  → groupId = entity_id when entity_type == "group"
  ↓
ref.invalidate(joinRequestsProvider(groupId))
notificationProvider.refresh(ignoreCache: true)
unreadCountProvider invalidate
```

Bridge is wired in `runtime_init.dart` (`notificationRealtimeBridgeProvider`). Single listener; re-attached on auth; cleared on logout.

`ConversationRuntimeStore` still ignores `new_notification` without `chatId` — that is why the bridge was added. Chat `NEW_MESSAGE` with `chatId` is skipped by the bridge (correct).

**If the APK lacks `d8029436`:** even a correctly addressed socket event would not invalidate `joinRequestsProvider`. Join Requests would stay stale. That alone explains G1/G2 UI failure **if** events were arriving.

Foreground G1/G2 **also** reported **no notification**. Socket miss + FCM miss together match “no notification.”

BackgroundGovernor **disconnects the socket when the app is backgrounded**. G3 cannot rely on socket; it requires FCM. G3 FAIL is therefore FCM (and/or BUG-N1a), not the bridge parser.

---

## 6. FCM Trace

```text
after() → evaluatePushNotifications
  → shouldSendPush({ userId: clerkId || supabaseId, type, entityType, entityId })
  → PushService.sendPush (tokens on fcm_device_tokens)
  → Android FCM
  → FCMService.onMessage / background / tap
  → router (tap only) + NotificationRealtimeBridge (receive)
```

`GROUP_JOIN_REQUEST_RECEIVED` is **MEDIUM** and in `REALTIME_SOCKET_DELIVERED_TYPES`.

**Online + that type → FCM suppressed** (assumes socket already delivered).

Presence key: `user_socket:${userId}` where `userId` is **Clerk id when clerkId exists**.

Mobile presence is stored as **`user_socket:{UUID}`**.

| Recipient identity | isOnline as computed | Socket emit | FCM |
| :--- | :--- | :--- | :--- |
| Has clerk_id, mobile connected | **false** (Clerk key empty) | Emitted to Clerk room (**mobile not in room**) | **Eligible** (if admin check + token) |
| No clerk_id, mobile connected | **true** (UUID key populated) | **Skipped** (`if (clerkId)`) | **Suppressed** (online + realtime type) |

`isUserGroupAdmin` requires membership `role` `admin` or `owner`. It does **not** treat `groups.creator_id` as sufficient. A creator whose membership role is not `admin`/`owner` fails the MEDIUM FCM gate even when treated as offline.

G1/G2 are **foreground**. Do **not** classify the whole bug as BUG-N1a. G3 may overlap BUG-N1a **in addition** to the addressing/suppression bugs.

Firebase project mismatch is documented (`kovari-8a50a` vs `kovari-19a83`) — can cause FCM fail independently. Not proven here.

---

## 7. Provider / UI Trace

`JoinRequestsSheet` watches `joinRequestsProvider(groupId)` (`FutureProvider.family`). Invalidation triggers a new `getJoinRequests(..., ignoreCache: true)` **only if the family is listened to or later watched**.

If the sheet is **open**, invalidation rebuilds the list. If the user is **elsewhere**, invalidation still refreshes the family; opening the sheet should show new data **if** invalidation ran.

Mutation path (`group_details_provider.dart`) is unchanged and QA Scenario 5 **PASS** — do not touch it.

No evidence that provider invalidation is the **first** failure: the event likely never reaches the bridge on mobile.

---

## 8. Exact Failure Boundary

### Path A — Realtime socket (G1/G2 foreground)

```text
pending_request DB write              PASS (QA: request exists; G5 mutation works)
        ↓
notifyGroupJoinRequestRecipients      UNKNOWN runtime (needs notifications row)
        ↓
notifications INSERT                 UNKNOWN runtime (needs SQL)
        ↓
after() Redis publish                UNKNOWN runtime (needs Vercel/Redis logs)
        ↓
Socket subscriber                    UNKNOWN runtime (needs Render logs)
        ↓
io.to(user_socket:{clerkId})         CODE-PROVEN MISS for mobile
        ↓
Mobile socket in user_socket:{uuid} FAIL (first proven break if emit ran)
        ↓
NotificationRealtimeBridge           NEVER RECEIVES EVENT
        ↓
joinRequestsProvider invalidate     DOES NOT RUN
```

**First proven failed stage (socket path):**  
**Socket.IO room addressing — emit Clerk room, mobile joined UUID room.**

This is sufficient to fail G1/G2 socket delivery even when backend + socket subscriber + APK bridge are all live.

### Path B — FCM (should cover G1/G2 if socket misses, and G3/G4)

Not a substitute until we confirm:

1. `after()` ran  
2. FCM token exists for Account A  
3. `shouldSendPush` returned true (admin check + not in black-hole case)  
4. APK/FCM project can display the message  

If Account A has **no clerk_id**, Path B is **code-proven suppressed** while Path A is **skipped** — **hard fail with no delivery channel**.

### Path C — APK without `d8029436`

```text
Event arrives (if rooms fixed)  PASS
        ↓
Bridge missing                  FAIL
        ↓
UI stale                        FAIL
```

Compatible with G5 PASS (older G2 APK). **Does not by itself explain zero FCM** unless FCM was also suppressed/not sent.

---

## 9. Root Cause

**Primary (code-proven, mobile receiver):**  
`emitRealtimeNotification` / socket subscriber target `user_socket:{clerkUserId}` only. Mobile Socket.IO connections join `user_socket:{JWT sub}` and JWT `sub` is the **internal UUID**. The mobile client never receives `new_notification` for join requests. Chat is unaffected.

**Contributing (code-proven):**

1. FCM online detection uses the **Clerk** Redis presence key; mobile presence is the **UUID** key — online mobile users look **offline** to FCM when they have a clerk id (FCM should still send).  
2. Recipients **without** `clerk_user_id`: **no Redis emit** + FCM **suppressed** because UUID presence looks online.  
3. `isUserGroupAdmin` does not treat group **creator** as eligible unless role is admin/owner.  
4. **Deployment/APK SHA unconfirmed** — may compound (old APK and/or stale Render).

**Not the first break:** `group_details_provider.dart` mutation invalidation; chat pipeline; payload missing `entity_id` (payload is correct **if delivered**).

---

## 10. Evidence

| Evidence | Type |
| :--- | :--- |
| `jwt.ts`: `sub: userId (UUID)` + `isUUIDv4(payload.sub)` | Code |
| `socket_service.dart` auth `userId: user.id` (mobile user id) | Code |
| `server.ts` `socket.join('user_socket:' + userId)` | Code |
| Notification Redis handler `io.to('user_socket:' + clerkUserId)` only | Code |
| Ban handler uses **both** clerk and user id keys | Code (contrast) |
| `createNotification` `if (clerkId) emitRealtimeNotification` | Code |
| `REALTIME_SOCKET_DELIVERED_TYPES` + online → FCM false | Code |
| Human QA G1–G4 FAIL, G5–G6 PASS | Production QA |
| Commits on `origin/master` | Git |
| Vercel/Render SHA / APK SHA | **Missing** |
| `notifications` row for Test G | **PRODUCTION DATA REQUIRED** |
| Logcat `[NotificationRealtimeBridge]` | **DEVICE LOG REQUIRED** |

No production logs were accessible from this environment.

```text
PRODUCTION LOG ACCESS REQUIRED
```

---

## 11. Proposed Minimal Fix

**Do not implement in this task.** Next implementation should be the smallest of:

1. **Socket fan-out (required):** In the socket subscriber (and/or `emitRealtimeNotification` payload), emit `new_notification` to **both** `user_socket:{clerkUserId}` **and** `user_socket:{supabaseId}`, matching the ban-channel pattern. Optionally join mobile sockets to both rooms at connect (larger change; dual emit is smaller).

2. **FCM presence (required for G3 and clerk-less users):** Resolve presence with the same key the socket actually uses (UUID for mobile), **or** only suppress FCM after confirming the target room has sockets. Do not suppress FCM when Redis emit was skipped.

3. **Creator FCM eligibility:** Treat `groups.creator_id` as eligible for `GROUP_JOIN_REQUEST_RECEIVED`, not only `role in (admin, owner)`.

4. **Release process:** Confirm Vercel + Render SHA include `e9ad6bf8`; rebuild APK from `d8029436`+ and record version on the Test G protocol.

**Do not** change `group_details_provider.dart` mutation paths. **Do not** change chat `receive_message` / `NEW_MESSAGE` room behavior.

---

## 12. Regression Risk Analysis

| Area | Risk if dual-room emit + FCM presence fix |
| :--- | :--- |
| BUG-G2 A–F | Low — mutation path untouched |
| Chat send/receive | Low — different rooms/events |
| Web `new_notification` | Low — Clerk room still targeted |
| Duplicate FCM + socket | Medium — keep existing online suppression **after** presence key matches actual socket room |
| Duplicate socket events | Low if still one emit per room membership |

---

## 13. Required Production Data

Only what is needed to confirm runtime vs code-proven miss:

### One Test G reproduction (Account B web → Account A mobile)

| Source | Need | Do not send |
| :--- | :--- | :--- |
| Account B | Timestamp (UTC), group UUID, confirmation join request succeeded | Passwords, tokens |
| Account A | APK versionName/versionCode, whether logcat shows `[NotificationRealtimeBridge] Listeners attached`, socket connected in UI/debug if any | JWT, FCM server key |
| Supabase | Row in `notifications`: `type`, `user_id`, `entity_id`, `created_at`, `push_status` for that timestamp | Service role key |
| Vercel | Deployment SHA for `app.kovari.in` at that time | Env secrets |
| Render | Socket deploy SHA / “Redis adapter enabled” + subscribe logs | Redis URL password |

If `notifications` has **no row**, backend `after`/notify did not run in production (deploy or silent notify failure).  
If row exists and `push_status` is `suppressed`/`no_token`, FCM path is confirmed.  
If row exists and logcat never shows bridge processing, the event did not reach the client (room miss and/or old APK).

---

## 14. Human QA Required After Fix

Navneet / Tirth only, production APK, protocol in [`bug-g2b-mobile-fix-validation.md`](file:///c:/Users/navne/CSE/DEV/KOVARI/docs/production-qa/phase-1/bug-g2b-mobile-fix-validation.md).

Must re-run G1–G4 (must PASS) and G5–G6 (must remain PASS). Do not mark BUG-G2b PASS until then.

BUG-R4, BUG-N1a, BUG-N1b remain independently OPEN.

---

## STOP

No application source code was changed. No APK was built. No browser or device QA was performed by this investigation.

**Next implementation action (after approval):** dual-address `new_notification` to Clerk **and** Supabase UUID rooms; align FCM presence/suppression with that addressing; rebuild and deploy APK + confirm Vercel/Render SHAs.
