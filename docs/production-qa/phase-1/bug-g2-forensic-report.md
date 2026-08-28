# BUG-G2 Forensic Investigation Report

> **Bug ID:** `BUG-G2`  
> **Module:** Groups / Membership Synchronization  
> **Platform:** Mobile (Flutter) + Backend (Supabase/Next.js)  
> **Severity:** High  
> **Status:** MUTATION SYNC FIX VERIFIED — INCOMING REALTIME SYNC OPEN (`BUG-G2b`)  

---

## 1. Production Reproduction Summary

### Scenario A — Join Request Submission
1. Account B requests to join Account A's group via the mobile application.
2. `joinRequest()` API call executes successfully on the backend (`POST /api/groups/[groupId]/join-request`).
3. Backend creates a `group_memberships` row with `status = 'pending_request'`.
4. **Mobile Issue:** Account B's membership UI button remains stuck on *"Request to Join Group"* instead of updating to *"Request Pending"*.

### Scenario B — Accept Membership Request
1. Account B submits a join request.
2. Account A (Group Creator/Admin) opens the `JoinRequestsSheet` in the mobile app or Web app and taps **Accept**.
3. `approveRequest()` API call executes successfully on the backend (`POST /api/groups/[groupId]/join`).
4. Backend updates the `group_memberships` status from `'pending_request'` to `'accepted'`.
5. **Mobile Issue 1:** In Account A's `JoinRequestsSheet`, the accepted request remains in the pending requests list instead of disappearing immediately.
6. **Mobile Issue 2:** In Account A's and Account B's member list UI (`OverviewTab`, `GroupMembersManagementSheet`), Account B does **not** appear in the active members list.
7. **Mobile Issue 3:** On reopening or refreshing the group, the member list continues to show stale data.

### Scenario C — Leave Group / Remove Member
1. A member leaves (`leaveGroup()`) or is removed by Admin (`removeMember()`).
2. Backend correctly updates or deletes the `group_memberships` record.
3. **Mobile Issue:** The local membership state store (`memberStoreProvider`, `membershipStoreProvider`) is not re-fetched or force-subscribed, leaving the member visible in the group and holding stale access permissions.

---

## 2. Expected Behavior

When any membership mutation (join, approve, reject, leave, remove) completes:
1. The backend database updates the `group_memberships` table (Single Source of Truth).
2. The mobile client immediately invalidates disk/memory caches for the affected endpoints.
3. The hydrated entity stores (`memberStoreProvider`, `membershipStoreProvider`, `groupStoreProvider`) and `joinRequestsProvider` re-fetch fresh data from the network with `force: true` / `ignoreCache: true`.
4. The UI immediately reflects:
   - Approved requests cleared from pending list.
   - Newly accepted members visible in the active member list.
   - Updated member counts and permissions everywhere.

---

## 3. Actual Behavior

1. **Stale Stores After Mutation:** `GroupActionsNotifier` in `group_details_provider.dart` was invalidating `groupMembersProvider` and `groupMembershipProvider` — **two dead, completely unused `FutureProvider`s**!
2. **Unrefreshed Hydrated Stores:** All UI components (`GroupDetailsScreen`, `OverviewTab`, `SettingsTab`, `GroupMembersManagementSheet`, `ChatScreen`) watch the hydrated entity stores (`memberStoreProvider`, `membershipStoreProvider`, `groupStoreProvider`). These stores were **never forced to re-subscribe/hydrate** after membership mutations.
3. **Cache Interception in `getJoinRequests`:** `GroupService.getJoinRequests(groupId)` called `_apiClient.get` **without `ignoreCache: true`**. Even when `joinRequestsProvider` was invalidated, `ApiClient` intercepted the network request and returned the 2-hour stale cached response from `localCacheProvider`.
4. **Uncleared Disk Cache:** `localCacheProvider` keys (`ApiEndpoints.groupJoinRequest(groupId)`, `ApiEndpoints.groupMembers(groupId)`, `ApiEndpoints.groupMembership(groupId)`) were not invalidated on mutations.

---

## 4. Data-Flow Trace

```text
User taps "Accept" / "Reject" / "Remove" / "Join" / "Leave"
       │
       ▼
GroupActionsNotifier (in group_details_provider.dart)
       │
       ▼
GroupService API Mutation (POST / DELETE to Backend)
       │
       ├──► Backend DB (`group_memberships` updated) ✅ [PASSED - BACKEND IS TRUTH]
       │
       ▼
[PREVIOUS DEFECTIVE CLIENT FLOW]:
  1. Invalidated unused `groupMembersProvider` & `groupMembershipProvider` (UI doesn't watch these) ❌
  2. `joinRequestsProvider` invalidated, but `getJoinRequests` lacked `ignoreCache: true` ❌
  3. `ApiClient` cache returned stale cached list ❌
  4. `memberStoreProvider`, `membershipStoreProvider`, `groupStoreProvider` NEVER updated ❌
       │
       ▼
[EXPECTED / PROPOSED FIX FLOW]:
  1. Clear local disk cache for group membership endpoints (`localCacheProvider.delete(...)`)
  2. Call `getJoinRequests(groupId, ignoreCache: true)` when refreshing requests
  3. Trigger force re-hydration on active entity stores:
     - `memberStoreProvider.notifier.subscribe(groupId, force: true)`
     - `membershipStoreProvider.notifier.subscribe(groupId, force: true)`
     - `groupStoreProvider.notifier.subscribe(groupId, force: true)`
  4. Invalidate `joinRequestsProvider` & `myGroupsProvider`
       │
       ▼
UI Re-renders with Fresh Backend State ✅
```

---

## 5. Root Cause Analysis

The root cause consists of **three specific client-side flaws** in `apps/mobile/lib/features/groups`:

1. **Dead Provider Invalidation Target (`group_details_provider.dart`):**
   `GroupActionsNotifier` was written to invalidate `groupMembersProvider` and `groupMembershipProvider`. However, the app's architecture was previously refactored to use Riverpod `Notifier` entity stores (`memberStoreProvider`, `membershipStoreProvider`, `groupStoreProvider`). The invalidation calls targeted old `FutureProvider`s that no widget listened to, leaving the active stores un-hydrated.

2. **Lack of Cache Bypass on `getJoinRequests` (`group_service.dart`):**
   `getJoinRequests` did not expose an `ignoreCache` parameter or pass `ignoreCache: true` to `_apiClient.get`. Consequently, `ApiClient` intercepted request invalidations and returned stale cached responses from memory/disk cache.

3. **Missing Store Refresh & Cache Deletion in `GroupActionsNotifier`:**
   After performing `approveRequest`, `rejectRequest`, `removeMember`, `joinRequest`, `joinViaInvite`, or `leaveGroup`, the notifier did not clear local cache entries or force-subscribe the hydrated entity stores (`memberStoreProvider`, `membershipStoreProvider`, `groupStoreProvider`).

---

## 6. Impacted Modules & Features

- **Group Details & Overview:** Member avatars, total member count, and admin/creator permission checks.
- **Group Settings:** Member management sheet, join requests sheet, pending request badge counts.
- **Group Itinerary & Chat:** Membership status and permission checks determining read/write access.
- **My Groups List:** Group membership status and list updates after joining or leaving.

---

## 7. Minimal Fix Recommendation

To resolve BUG-G2 with zero regression risk:

1. **`GroupService` (`group_service.dart`):**
   - Add `bool ignoreCache = false` parameter to `getJoinRequests`. Pass `ignoreCache: ignoreCache` to `_apiClient.get`.

2. **`GroupActionsNotifier` (`group_details_provider.dart`):**
   - In `approveRequest`, `rejectRequest`, `removeMember`, `joinRequest`, `joinViaInvite`, `leaveGroup`:
     - Delete relevant local cache keys (`groupMembers`, `groupMembership`, `groupJoinRequest`, `groupDetails`) from `localCacheProvider`.
     - Force-refresh `memberStoreProvider`, `membershipStoreProvider`, and `groupStoreProvider` via `.subscribe(_groupId, force: true)`.
     - Pass `ignoreCache: true` when invalidating or refreshing `joinRequestsProvider`.

3. **No Backend or Web Modifications:**
   - Forensic analysis confirms the backend REST endpoints (`/api/groups/[groupId]/join`, `/api/groups/[groupId]/members`, `/api/groups/[groupId]/membership`, `/api/groups/[groupId]/join-request`) operate correctly.
   - The Web application remains untouched.

---

## 8. Verification Strategy

1. **Automated Unit & Integration Tests:**
   - Test membership hydration (`accepted`, `pending`, `rejected`, `left`).
   - Test store updates after `approveRequest`, `rejectRequest`, `removeMember`, `joinRequest`, `leaveGroup`.
   - Test cache bypass behavior.
2. **Static Analysis:** `flutter analyze lib` must pass with zero issues.
3. **Automated Test Suite:** `flutter test` must pass all tests.
4. **Physical Device QA:** Verify all 6 reproduction scenarios (A through F) on physical Android device with production backend.

---

## 9. Post-Fix Validation Results (2026-08-29)

Human QA on production Android APK confirmed the mutation-side fix resolves the original BUG-G2 reproduction scenarios:

| Test | Scope | Result |
| :--- | :--- | :--- |
| A | Join request button → *Request Pending* | **PASS** |
| B | Accept → pending list clears, member appears | **PASS** |
| C | Reject → request removed from pending list | **PASS** |
| D | Remove member → active list updates | **PASS** |
| E | Leave group → redirect and non-member state | **PASS** |
| F | Cross-platform + cold-start parity | **PASS** |
| G | Incoming join request push + dynamic Join Requests sheet | **FAIL** |

Full protocol and evidence: [`bug-g2-fix-validation.md`](file:///c:/Users/navne/CSE/DEV/KOVARI/docs/production-qa/phase-1/bug-g2-fix-validation.md).

---

## 10. Remaining Gap — Incoming Join Request Realtime Sync (`BUG-G2b`)

The implemented fix in `group_details_provider.dart` and `group_service.dart` operates exclusively on **outbound mutations** initiated by the local user (join, approve, reject, remove, leave). It does **not** address **inbound events** when another client submits a join request to a group where the local user is admin.

### Observed Behavior (Test G)

1. Account B submits a join request (mobile or web).
2. Backend creates the `group_memberships` row with `status = 'pending_request'` ✅
3. Account A (admin, on mobile):
   - Does **not** receive a push notification ❌
   - Join Requests sheet / pending badge does **not** update dynamically ❌
   - Must manually navigate away and back (or restart) to see the new request ❌

### Distinction from Original BUG-G2

| Dimension | Original BUG-G2 | Remaining BUG-G2b |
| :--- | :--- | :--- |
| Trigger | Local user performs mutation (accept/reject/join/leave) | Remote user submits join request |
| Fix scope | Cache invalidation + entity store force-subscribe after API call | Socket/FCM listener → passive provider invalidation |
| QA status | **PASS** (Tests A–F) | **FAIL** (Test G) |

### Recommended Next Steps

1. Audit mobile socket handler registration for group membership / join-request events.
2. Confirm backend emits the correct socket event and FCM payload for `group_join_request` notifications.
3. On inbound event, invalidate `joinRequestsProvider` with `ignoreCache: true` and refresh pending badge counts.
4. Cross-reference **`BUG-R4`** (Requests screen live sync) and **`BUG-N1a`** (background push delivery) for shared infrastructure fixes.
