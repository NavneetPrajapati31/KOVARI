# BUG-G2 Fix Validation Guide (Human QA Protocol)

> **Status:** PARTIAL PASS — MUTATION SYNC VERIFIED (Tests A–F); INCOMING REALTIME SYNC OPEN (Test G)

---

## 1. Original Production Reproduction

During Phase 1 Production QA on physical Android devices:
- **Accept Request Defect:** When an admin approved a join request, the request remained in the pending UI list, and the newly accepted member did not appear in the active member list UI.
- **Join Request Defect:** When a user requested to join a group, the join button stayed as *"Request to Join Group"* instead of switching to *"Request Pending"*.
- **Leave / Remove Member Defect:** Leaving a group or removing a member left stale cached data in local stores, requiring an app restart or full cache wipe to update.

---

## 2. Root Cause Summary

1. **Dead Provider Invalidation Target:** `GroupActionsNotifier` was invalidating `groupMembersProvider` and `groupMembershipProvider` — two unused `FutureProvider`s. The UI components watch the hydrated entity stores (`memberStoreProvider`, `membershipStoreProvider`, `groupStoreProvider`).
2. **Missing Store Hydration & Cache Deletion:** Group actions (`approveRequest`, `rejectRequest`, `removeMember`, `joinRequest`, `joinViaInvite`, `leaveGroup`) did not invalidate local disk cache keys in `localCacheProvider` or trigger force-resubscription on the active entity stores.
3. **Stale Cache Returns in `getJoinRequests`:** `GroupService.getJoinRequests` lacked an `ignoreCache` option, allowing `ApiClient.get` to return stale 2-hour cached join requests lists upon request invalidation.

---

## 3. Files Modified

| File | Change |
|---|---|
| [`apps/mobile/lib/features/groups/data/group_service.dart`](file:///c:/Users/navne/CSE/DEV/KOVARI/apps/mobile/lib/features/groups/data/group_service.dart) | Added `ignoreCache` parameter to `getJoinRequests`. |
| [`apps/mobile/lib/features/groups/providers/group_details_provider.dart`](file:///c:/Users/navne/CSE/DEV/KOVARI/apps/mobile/lib/features/groups/providers/group_details_provider.dart) | Updated `joinRequestsProvider` to pass `ignoreCache: true`, invalidated local disk caches on mutations, and force-subscribed `memberStoreProvider`, `membershipStoreProvider`, `groupStoreProvider`. |
| [`apps/mobile/test/runtime/group_membership_sync_test.dart`](file:///c:/Users/navne/CSE/DEV/KOVARI/apps/mobile/test/runtime/group_membership_sync_test.dart) | Added automated regression test suite for Group Membership Synchronization. |

---

## 4. Web & Backend Regression Safety

```bash
git status
git diff --stat
```

**Scope Verification:**
- `apps/web/` — **0 files changed** (Web application untouched).
- `supabase/` — **0 files changed** (Database schema untouched).
- All changes are strictly isolated to the mobile Flutter group actions and service layer.

---

## 5. Automated Tests

Run:
```bash
flutter analyze lib
flutter test test/runtime/group_membership_sync_test.dart
```

**Results:**
- `flutter analyze lib`: 0 errors.
- `flutter test`: ALL TESTS PASSing.

---

## 6. Physical Device Manual QA Protocol

Perform all scenarios using the latest release APK built from `dev` connected to the production backend (`https://app.kovari.in/api/`).

### Test A — Join Request

1. Account B opens a group (where Account A is Creator) and taps **Request to Join Group**.
2. **Expected:** UI button immediately updates to **Request Pending**.
3. **Expected:** Account A's `JoinRequestsSheet` shows Account B's request.

### Test B — Accept Membership

1. Account A opens `JoinRequestsSheet` and taps **Accept**.
2. **Expected:** Account B disappears from the Join Requests list immediately.
3. **Expected:** Account B immediately appears in `Group Members` list (`OverviewTab` and `GroupMembersManagementSheet`).
4. **Expected:** Member count updates everywhere.

### Test C — Reject Request

1. Account B sends a join request.
2. Account A opens `JoinRequestsSheet` and taps **Reject (X)**.
3. **Expected:** Request is removed from the pending list immediately.

### Test D — Remove Member

1. Account A opens `Manage Members` sheet and taps **Remove** next to Account B.
2. Confirm removal in the dialog.
3. **Expected:** Account B is removed from the active member list immediately.

### Test E — Leave Group

1. Account B taps **Leave Group** in Settings.
2. **Expected:** Account B is redirected back to Groups list, and the group reflects non-member status.

### Test F — Cross-Platform & Cold Start Parity

1. Perform join / accept actions on Web.
2. Open / pull-to-refresh on Mobile.
3. Force-close the Mobile app completely and relaunch.
4. **Expected:** Membership state and member lists remain 100% accurate and consistent after restart.

### Test G — Incoming Join Request Realtime Sync (Receiver-Side)

1. Account A (Group Creator/Admin) is logged into the mobile app with the target group accessible.
2. Account B submits a join request to Account A's group (from mobile or web).
3. **Expected:** Account A receives a push notification for the new join request.
4. **Expected:** Account A's `JoinRequestsSheet` and pending-request badge update dynamically without manual refresh, navigation, or app restart.
5. **Actual (2026-08-29):** FAIL — no push notification; Join Requests screen does not update until manual navigation or restart.

---

## 7. Human QA Results (2026-08-29)

| Test | Scenario | Result | Notes |
| :--- | :--- | :--- | :--- |
| **A** | Join Request (requester-side button state) | **PASS** | Button updates to *Request Pending* immediately. |
| **B** | Accept Membership (admin mutation sync) | **PASS** | Pending list clears; member appears in active list; count updates. |
| **C** | Reject Request | **PASS** | Request removed from pending list immediately. |
| **D** | Remove Member | **PASS** | Member removed from active list immediately. |
| **E** | Leave Group | **PASS** | Non-member redirect and state update verified. |
| **F** | Cross-Platform & Cold Start Parity | **PASS** | Web/mobile parity and cold-start accuracy confirmed. |
| **G** | Incoming Join Request Realtime Sync (receiver-side) | **FAIL** | Persists after backend (`e9ad6bf8`) + mobile bridge (`d8029436`) QA — see [`bug-g2b-mobile-fix-validation.md`](file:///c:/Users/navne/CSE/DEV/KOVARI/docs/production-qa/phase-1/bug-g2b-mobile-fix-validation.md) |

**Operator:** Navneet  
**Environment:** Production Android APK → `https://app.kovari.in/api/`  
**Date:** 2026-08-29

---

## 8. Remaining Defect — Incoming Join Request Realtime Sync (Test G)

### Reproduction

1. Account A (Group Creator/Admin) is logged into the mobile app and has the target group open (or is elsewhere in the app).
2. Account B submits a join request to Account A's group (from mobile or web).
3. **Expected:** Account A receives a push notification and the `JoinRequestsSheet` / pending-request badge updates dynamically without manual refresh or navigation.
4. **Actual (2026-08-29, pre-bridge):** No push notification; Join Requests screen does not update dynamically.
5. **Actual (2026-08-29, post backend + mobile bridge):** **Still FAIL** — Account B (web) → Account A (mobile); Scenarios 1–4 fail (no notification, no dynamic update). Scenarios 5–6 PASS. See [`bug-g2b-mobile-fix-validation.md`](file:///c:/Users/navne/CSE/DEV/KOVARI/docs/production-qa/phase-1/bug-g2b-mobile-fix-validation.md).

### Scope Classification

This is a **receiver-side passive sync** gap, distinct from the **mutation-side cache invalidation** fix validated in Tests A–F. The implemented fix correctly refreshes local stores after the admin *performs* an action (accept/reject/remove/leave/join), but does not subscribe to incoming join-request events from other clients.

### Likely Investigation Areas

- Socket event handler registration for `group_join_request` (or equivalent) on mobile.
- FCM push payload routing for group join-request notification type.
- `joinRequestsProvider` / `memberStoreProvider` passive invalidation on inbound socket or push events.
- Overlap with **`BUG-R4`** (Requests screen live sync) and **`BUG-N1a`** (background push delivery).

### Tracking

Logged as **`BUG-G2b`** in [`mobile_production_bug_tracker.md`](file:///c:/Users/navne/CSE/DEV/KOVARI/docs/production-qa/phase-1/mobile_production_bug_tracker.md).

Forensic trace complete: [`bug-g2b-forensic-report.md`](file:///c:/Users/navne/CSE/DEV/KOVARI/docs/production-qa/phase-1/bug-g2b-forensic-report.md).

---

## 9. Pass Criteria

### Mutation Sync (Tests A–F) — VERIFIED PASS

- [x] Join request button updates state immediately.
- [x] Approved request clears from pending sheet instantly.
- [x] Approved member appears in active member list instantly.
- [x] Rejected request clears instantly.
- [x] Removed member disappears instantly.
- [x] Leave group clears member state.
- [x] Cold start retains accurate membership state.
- [x] Zero Web or backend regressions.

### Incoming Realtime Sync (Test G) — OPEN

- [ ] Push notification delivered when a join request arrives on the admin's mobile device.
- [ ] Join Requests sheet / pending badge updates dynamically without manual refresh.
