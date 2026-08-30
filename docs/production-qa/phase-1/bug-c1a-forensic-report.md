# BUG-C1a — Same-Device Multi-Account Chat Session Leakage Forensic Report

> **Status:** FIX IMPLEMENTED — PENDING HUMAN QA  
> **Date:** 2026-08-31  
> **Operator:** Tirth  
> **Validation:** `bug-c1a-fix-validation.md`

---

## A. Symptom

When switching between two KOVARI accounts on the **same Android device**, the newly logged-in account's **Inbox / chat UI can briefly or persistently show conversations, snippets, avatars, or message state belonging to the previous account**.

Production observation recorded during Day 2 reconciliation (`day2_reconciliation.md`, `BUG-C1a`).

**This is a client-side session isolation defect**, not a confirmed backend authorization failure. Backend inbox APIs are user-scoped via JWT; the leak occurs in **local Riverpod runtime state and global Hive outbox stores** that survive logout.

---

## B. Reproduction (production)

1. Login as **Account A** on production Android APK.
2. Open **Inbox** and at least one conversation; allow messages to hydrate.
3. **Logout**.
4. Login as **Account B** on the same device.
5. Open **Inbox** (and any previously opened chat routes).

**Observed:** Account A conversations/snippets visible to Account B until refresh, navigation, or restart (exact timing varied by session).

---

## C. Trace — Logout → Login lifecycle

```text
User taps Logout
  → AuthNotifier.logout()
  → conversationCacheRepository.deleteCache()  ✅ user-scoped Hive boxes
  → AuthRepository.logout()                       ✅ tokens + localCache cleared
  → AuthState reset                               ✅
  → FCM unregister (main.dart listener)           ✅

NOT cleared before fix:
  → conversationRuntimeStoreProvider (in-memory inbox map)     ❌
  → messageStoreProvider.family (per-chat hot windows)         ❌
  → mutation_journal_v1 Hive box (global outbox)             ❌
  → pending_uploads_v1 Hive box (global media outbox)          ❌
  → RealtimeEventPipeline queued events                        ❌
  → activeConversationProvider                                 ❌

Account B login
  → fetchInbox() → seedFromInbox() ADDITIVE merge
  → Prior Account A runtime entries remain unless overwritten   ❌
  → Inbox UI reads conversationRuntimeStoreProvider directly  ❌ leak
```

---

## D. Root Cause

| # | Failure | Evidence |
| :--- | :--- | :--- |
| 1 | **Runtime store not cleared on logout** | `ConversationRuntimeStore` is a persistent `NotifierProvider`. Logout did not reset `state`. Inbox UI (`chat_inbox_screen.dart`) renders directly from this map. |
| 2 | **Additive inbox seeding** | `seedFromInbox()` explicitly preserves existing entries (`conversation_runtime_store.dart`: "ADDITIVE: existing runtime state is preserved"). After account switch, Account A entries remain alongside Account B fetches. |
| 3 | **Message hot windows persist** | `messageStoreProvider` is `NotifierProvider.family` without logout invalidation. Opening a chat after switch could hydrate Account A messages from memory. |
| 4 | **Global mutation journal** | `MutationJournal` uses Hive box `mutation_journal_v1` with **no userId scoping**. Pending sends from Account A could replay under Account B's socket session. |
| 5 | **Global pending uploads** | `PendingUploadStore` uses `pending_uploads_v1` — same cross-account risk for media outbox. |
| 6 | **Socket disconnect alone insufficient** | `SocketService` disconnects when `isAuthenticated` becomes false, but in-memory subscribers retained prior account data. |

**Backend verification:** No evidence that `/direct-chat/inbox` returns cross-user data when authenticated as Account B. Leak is **mobile state/cache lifecycle**.

---

## E. Security Implications

- **Privacy:** Prior user's conversation metadata and message bodies may be visible on a shared device.
- **Integrity:** Account A outbox mutations could emit under Account B credentials.
- **Severity:** Medium on shared devices; not a remote server-side ACL bypass.

---

## F. Minimal Fix (implemented)

| Change | File |
| :--- | :--- |
| Centralized `clearAccountScopedChatState()` on logout/ban | `core/auth/account_session_cleanup.dart` |
| Wire cleanup into `AuthNotifier.logout()` and `_handleBannedSession()` | `core/providers/auth_provider.dart` |
| `ConversationRuntimeStore.clearAccountState()` + auth listeners | `conversation_runtime_store.dart` |
| `MutationJournal.clearAll()` | `mutation_journal.dart` |
| `PendingUploadStore.clearAll()` | `pending_upload_store.dart` |
| `RealtimeEventPipeline.clearPendingQueues()` | `realtime_event_pipeline.dart` |
| `ref.invalidate(messageStoreProvider)` | `account_session_cleanup.dart` |

**Not modified:** Web UI, Next.js APIs, socket event contracts, backend persistence, DB schema.

---

## G. Automated Tests

| Suite | Coverage |
| :--- | :--- |
| `account_session_cleanup_test.dart` | Runtime clear, message store invalidation, active chat reset, journal/upload clear |

---

## H. Manual QA Required

Physical Android APK verification per `bug-c1a-fix-validation.md` before marking **VERIFIED PASS**.
