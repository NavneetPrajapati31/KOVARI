# BUG-C4a — Reconciliation Under BUG-C4b Outbox/Replay

> **Status:** **RECONCILED — COVERED BY BUG-C4b (NO STANDALONE IMPLEMENTATION)**  
> **Date:** 2026-08-30  
> **Primary fix reference:** `bug-c4b-forensic-report.md`, `bug-c4b-fix-validation.md`, `bug-c4b-production-deployment-checklist.md`

---

## 1. Summary

**BUG-C4a** was originally filed as a separate symptom:

> Outgoing messages composed while offline are silently discarded and never auto-retried or delivered upon reconnection.

Forensic review of the **BUG-C4b** implementation and production QA evidence shows that C4a's required behavior is **already delivered** by the C4b outbox/replay work. A second C4a engineering task would duplicate validated logic and risk regressing C4b.

**Action:** Reconcile and document — **do not reimplement**.

---

## 2. Original C4a Symptom → C4b Mechanism Mapping

| C4a expected behavior | C4b implementation | Evidence |
| :--- | :--- | :--- |
| Offline send is not silently dropped | `ChatMutationService.sendMessage()` records a pending mutation in Hive `MutationJournal` when socket is offline | `bug-c4b-forensic-report.md` §3 steps 2–3 |
| Message survives until connectivity returns | Optimistic message stays in `MessageStore`; journal entry remains `pending` | Same lifecycle trace |
| Automatic delivery on reconnect | `replayPendingMessages()` on socket reconnect; stuck `sending` reset to `pending` | `bug-c4b-post-fix-safety-audit.md` §2, §6 |
| No duplicate server records on replay | Backend `client_id` pre-check + unique index; mobile idempotent replay | `bug-c4b-post-fix-safety-audit.md` §4–5 |
| User-visible recovery after network drop | C4b validation **Test B** — airplane mode send → reconnect → auto replay, exactly one message | `bug-c4b-fix-validation.md` Test B |

---

## 3. Production QA Evidence

C4a's behavior is covered by **BUG-C4b human QA**, not by a standalone C4a test card:

| C4b test | C4a coverage | Production result |
| :--- | :--- | :--- |
| **Test B** — Outbox Replay & Connection Loss Recovery | Offline/connection-drop send → reconnect → auto delivery | **PASS** (`bug-c4b-production-deployment-checklist.md`, `bug-c4b-tests-d-e-post-fix-validation.md` regression safeguards) |
| **Test F** — Backend Idempotency (lost ACK replay) | Replay after transient disconnect without duplicate rows | **PASS** (same docs) |
| **Test D** — 15s timeout + manual retry | Stuck in-flight mutation recovery (adjacent, not pure offline-compose) | **PASS** (`bug-c4b-tests-d-e-post-fix-validation.md`) |

Automated coverage (mobile):

| Test | Coverage |
| :--- | :--- |
| `messaging_validation_test.dart` Test 8 — Outbox Replay Recovery for Stuck SENDING | Stuck `sending` → reconnect replay |
| `messaging_validation_test.dart` Test 1 — Direct Messaging | Optimistic send + ACK reconciliation |

---

## 4. Evidence Gaps (None Blocking)

| Gap | Assessment |
| :--- | :--- |
| No document titled "BUG-C4a-fix-validation.md" | **Acceptable** — C4b Test B is the explicit offline-outbox protocol |
| Day 2 reconciliation (`day2_reconciliation.md`) still shows C4 **FAIL** | **Historical** — captured pre-C4b-fix state (2026-08-27); superseded by C4b sign-off 2026-08-29 |
| Pure "compose offline, never connected" vs "drop mid-send" | Test B covers airplane-mode send + reconnect; functionally equivalent for outbox path |

No additional implementation is required unless a **new** regression is observed outside the C4b-validated scenarios.

---

## 5. Tracker / Matrix Reconciliation

| Artifact | C4a disposition |
| :--- | :--- |
| `mobile_production_bug_tracker.md` | **RECONCILED — COVERED BY BUG-C4b** |
| `mobile_regression_matrix.md` C4 | **PASS** (outbox replay verified under C4b Test B) |
| `mobile_production_qa_report.md` Phase 5 | Chat & Realtime **PASS** (C4b + C4a reconciled) |

**BUG-C4b** remains **VERIFIED PASS — QA SIGN-OFF COMPLETE**. **No C4b code changes.**

---

## 6. Out of Scope (Unchanged)

- Group chat offline outbox (C4b audit notes group messages lack `client_id` / same replay mechanism)
- BUG-C1a account-switch session leakage
- BUG-N1 background FCM delivery

---

## 7. Sign-Off

**BUG-C4a reconciled as covered by BUG-C4b outbox/replay implementation.** No standalone C4a fix or reimplementation required.
