# BUG-G3 — Group Itinerary Cross-Platform Sync Forensic Report

> **Status:** FORENSIC COMPLETE — **VERIFIED PASS — QA SIGN-OFF COMPLETE**  
> **Date:** 2026-08-29  
> **Severity:** High  
> **Scope:** Web → Mobile itinerary sync failure (create/update/delete)

---

## A. Executive Summary

**Symptom:** Itinerary items created or modified on production Web do not appear on production Mobile, even after pull-to-refresh, leaving/re-entering the group, or reopening the APK.

**Verdict:** Not a field-mapping/parser defect (unlike BUG-E5). The API persists data correctly; mobile **never refetches** itinerary after initial hydration because refresh paths omit `force: true` and group-level refresh skips itinerary entirely. **No realtime itinerary channel exists** on backend or mobile.

**First failed stage:** Mobile provider/state layer — `ItineraryStore.subscribe()` no-op when store already populated and `force == false`.

**Minimal fix (implemented):** Force itinerary re-hydration on pull-to-refresh, group-level refresh, and tab focus; invalidate local disk cache on forced refresh.

**Realtime:** Not implemented today on either platform. Live cross-client sync without refresh requires a separate backend + socket follow-up.

---

## B. Production Symptom (QA baseline)

From `mobile_production_bug_tracker.md` and regression matrix:

> Web user creates/updates group itinerary → Mobile user does not see changes after refresh, reload, or reopen.

**Failure classification:** **D (Cache)** + **F (Provider/state)** — not A (persistence), B (API), C (serialization), or G (UI rendering).

---

## C. Backend / API Trace

### Endpoints

| Operation | Route | File |
| :--- | :--- | :--- |
| List | `GET /api/groups/{groupId}/itinerary` | `apps/web/src/app/api/groups/[groupId]/itinerary/route.ts` |
| Create | `POST` same | same |
| Update | `PUT /api/groups/{groupId}/itinerary/{itemId}` | `apps/web/src/app/api/groups/[groupId]/itinerary/[itemId]/route.ts` |
| Delete | `DELETE` same | same |

GET selects: `id, title, description, datetime, type, status, location, priority, assigned_to, notes, image_url, external_link` — ordered by `datetime`.

### Persistence

Direct Supabase `itinerary_items` CRUD. **No API-level Redis cache.** Web mutations write to DB successfully (web client refetches after each mutation).

### Realtime publication

**None.** Itinerary routes do not call:

- `createNotification()`
- `emitRealtimeNotification()`
- Socket.IO emit helpers

Socket types (`packages/types/src/socket.ts`) and server handlers (`apps/web/src/services/socket/events.ts`) contain **no itinerary events**.

---

## D. Web Client Trace

**Primary UI:** `apps/web/src/app/(app)/groups/[groupId]/itinerary/page.tsx`

| Action | API | Refresh |
| :--- | :--- | :--- |
| Load | GET | `setItineraryItems(data)` |
| Create/Update/Delete | POST/PUT/DELETE | `fetchItineraryData()` after success |

Web uses **poll-on-mutation only** — no socket subscription for itinerary. Cross-tab live sync also requires refetch.

---

## E. Mobile Client Trace

### Model

`ItineraryItem` — `apps/mobile/lib/features/groups/models/group.dart` (L412–497)

Parses snake_case API fields; handles `assigned_to` arrays and nested objects. **Compatible with GET response.**

### API service

`GroupService.getGroupItinerary()` — `group_service.dart` L214–227

Network hydration uses `ignoreCache: true` in `_ItineraryHydratable.fetchFromNetwork()`.

### Display source

`ItineraryTab` watches **`itineraryStoreProvider`** — not `groupItineraryProvider`.

### ItineraryStore (critical)

`entity_stores.dart` L467–487:

```dart
Future<void> subscribe(String groupId, {bool force = false}) async {
  _metadata.putIfAbsent(groupId, EntityMetadata.new).subscriberCount++;
  if (state[groupId] == null || force) {
    // ... requestHydration(..., force: force)
  }
}
```

If `state[groupId]` already has data and `force == false`, **subscribe returns immediately** — no network refetch.

Disk cache TTL: **2 hours** (`entity_stores.dart` L523–526).

### Refresh paths (pre-fix defects)

| Path | Behavior | Problem |
| :--- | :--- | :--- |
| `GroupDetailsScreen.initState` | `subscribe(groupId)` once | OK for first load |
| `ItineraryTab` pull-to-refresh | `subscribe(groupId)` **no force** | **NO-OP after first hydrate** |
| `GroupDetailsScreen._onRefresh` | group/membership/members only | **Itinerary omitted** |
| Tab switch to Itinerary | No refresh | Stale in-session data |
| Mobile CRUD (`GroupActionsNotifier`) | `subscribe(..., force: true)` | Works for mobile-initiated changes only |

### Realtime listeners

`socket_service.dart` — chat, notifications, typing, presence only. **No itinerary handlers.**

---

## F. First Failed Stage

**File:** `apps/mobile/lib/features/groups/providers/entity_stores.dart`  
**Function:** `ItineraryStore.subscribe()`  
**Condition:** `if (state[groupId] == null || force)` — when false, hydration skipped.

**Triggering UX path (Web → Mobile):**

```text
Mobile opens group → ItineraryStore hydrates (possibly empty or stale)
Web creates item → DB updated
Mobile user pull-to-refresh on Itinerary tab
  → subscribe(groupId) without force
  → state[groupId] != null
  → NO network fetch
  → UI unchanged
```

Secondary failed stage: `group_details_screen.dart` `_onRefresh` — itinerary store not included in group-level refresh.

---

## G. Root Cause (code-backed)

1. **No push/realtime path** for itinerary mutations (backend + mobile).
2. **Refresh does not force re-hydration** — user-facing refresh paths call `subscribe()` without `force: true`.
3. **Group pull-to-refresh skips itinerary** entirely.
4. **In-session memory stickiness** — `IndexedStack` + `AutomaticKeepAliveClientMixin` + populated Riverpod store preserve stale list for session lifetime.

**Not root cause:** API serialization mismatch, RLS blocking reads, or `ItineraryItem.fromJson` failure.

---

## H. Realtime Expectation

| Question | Answer |
| :--- | :--- |
| Is realtime implemented? | **No** |
| Does mobile subscribe to itinerary socket events? | **N/A — none exist** |
| Can mobile sync without refresh today? | **Only via forced re-hydration** |

QA Scenario G (realtime while on itinerary screen) **cannot pass** without a future backend emit + mobile listener. Phase-1 fix targets **refresh/reload correctness** first.

---

## I. Serialization / Field Audit

| Check | Result |
| :--- | :--- |
| GET columns vs `fromJson` | **Compatible** |
| E5-style transformer gap | **N/A** — raw JSON returned |
| Dual model classes | `group.dart` vs `home_data.dart` — group tab uses correct model |

---

## J. Minimal Fix Proposal (implemented)

### Mobile-only (no backend/web changes)

1. **`ItineraryStore.subscribe(force: true)`** — invalidate `ApiEndpoints.groupItinerary(groupId)` local cache before forced hydration.
2. **`ItineraryTab` pull-to-refresh** — `subscribe(groupId, force: true)` and await.
3. **`GroupDetailsScreen._onRefresh`** — include itinerary store with `force: true`.
4. **Tab focus** — when user selects Itinerary tab (index 2), force refresh.

### Explicitly NOT in this fix

- Socket/realtime infrastructure
- Backend itinerary event emission
- G2/G2b notification or membership code
- `NotificationRealtimeBridge`
- Architecture rewrite

### Future follow-up (optional)

- Emit `itinerary_updated` from POST/PUT/DELETE routes
- Mobile socket handler → `itineraryStoreProvider.notifier.refresh(groupId)`

---

## K. Files Modified (implementation)

| File | Change |
| :--- | :--- |
| `apps/mobile/lib/features/groups/providers/entity_stores.dart` | Cache invalidate on forced subscribe |
| `apps/mobile/lib/features/groups/widgets/tabs/itinerary_tab.dart` | Force refresh on pull |
| `apps/mobile/lib/features/groups/screens/group_details_screen.dart` | Itinerary in group refresh + tab focus refresh |
| `apps/mobile/test/runtime/itinerary_sync_test.dart` | Serialization + refresh contract tests |

---

## L. Protected Systems

Untouched:

- BUG-G2 / G2b / G2b-TAP membership and notification paths
- `group_details_provider.dart` mutation logic (except shared store refresh pattern)
- Web itinerary routes and UI
- Socket notification pipeline

---

## M. Test Plan

### Automated

- `ItineraryItem.fromJson` parses production API shape
- Refresh contract documented via tests

### Manual (production APK required)

- Scenarios A–G from BUG-G3 task card
- G2 membership regression spot-check

---

## N. Git Safety

Forensic + implementation on clean `dev` branch. No backend/web/supabase changes.

---

**Next step:** Production APK build → physical-device QA → update `bug-g3-fix-validation.md` → tracker sign-off.

---

## O. Production QA Sign-Off (2026-08-29)

> **Status:** **VERIFIED PASS — QA SIGN-OFF COMPLETE**

| Scenario | Result |
| :--- | :--- |
| A — Web create → Mobile | **PASS** |
| B — Web update → Mobile | **PASS** |
| C — Web delete → Mobile | **PASS** |
| D — Mobile create → Web | **PASS** |
| E — Mobile update → Web | **PASS** |
| F — Mobile delete → Web | **PASS** |
| G — Realtime on-screen | **N/A** (no socket channel; out of scope) |
| H — Cold-start persistence | **PASS** |
| I — G2 membership regression | **PASS** |

See `bug-g3-fix-validation.md` for full validation record.
