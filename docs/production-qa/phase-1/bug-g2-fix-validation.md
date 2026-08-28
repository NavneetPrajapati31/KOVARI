# BUG-G2 Fix Validation Guide (Human QA Protocol)

> **Status:** FIX IMPLEMENTED — HUMAN QA REQUIRED

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

---

## 7. Pass Criteria

- [ ] Join request button updates state immediately.
- [ ] Approved request clears from pending sheet instantly.
- [ ] Approved member appears in active member list instantly.
- [ ] Rejected request clears instantly.
- [ ] Removed member disappears instantly.
- [ ] Leave group clears member state.
- [ ] Cold start retains accurate membership state.
- [ ] Zero Web or backend regressions.
