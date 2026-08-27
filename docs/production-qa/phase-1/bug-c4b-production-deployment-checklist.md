# BUG-C4b Production Deployment Checklist

This checklist tracks the deployment and verification of the **BUG-C4b (Intermittent Realtime Chat Message Delivery Failures)** fix to the production environment. 

---

## 1. Commit and Branch State

| Parameter | Value | Status |
| :--- | :--- | :--- |
| **BUG-C4b Fix Commit** | `0089a2ba` | `MERGED & DEPLOYED` |
| **Source Branch** | `dev` | `READY` |
| **Production Branch** | `master` | `PROMOTED` |
| **Production Target Commit** | `e1f7ebf1` (including post-fix updates) | `DEPLOYED` |

---

## 2. Deployment and Migration Steps

### A. Database Migration (Prerequisite)
The database unique constraint must be applied before or concurrently with the socket backend deployment.

* **Target Table:** `public.direct_messages`
* **Target Column:** `client_id`
* **Index Name:** `idx_direct_messages_client_id_unique`
* **Migration SQL:**
  ```sql
  CREATE UNIQUE INDEX IF NOT EXISTS idx_direct_messages_client_id_unique 
  ON public.direct_messages (client_id) 
  WHERE client_id IS NOT NULL;
  ```
* **Safety Evaluation:** **SAFE**. The index is partial (`WHERE client_id IS NOT NULL`), meaning multiple legacy or web messages with `NULL` client IDs will not violate the constraint. No table rewrite or downtime is required.
* **Status:** `APPLIED TO PRODUCTION DATABASE` (completed).
* **Action:** Applied via Supabase Dashboard SQL Editor.

---

### B. Backend Deployment
* **Service:** Production Socket Service + Web App
* **Target Host:** Render (`socket.kovari.in` / `kovari-socket.onrender.com` & `app.kovari.in`)
* **Branch Deployed:** `master`
* **Impacted Code:** `apps/web/src/services/socket/events.ts` and `apps/web/src/shared/hooks/useGroupChat.ts`
* **Status:** `DEPLOYED TO PRODUCTION` (completed).
* **Action:** Merged to `master` and redeployed on Render.

---

## 3. Production Verification Plan

### C. Automated / Infrastructure Verification (Post-Deployment)
Verify these checks before handing off to the QA operators:

- [x] **Socket Server Health Check:** Query `https://socket.kovari.in/health` and verify it returns `{ "status": "ok" }`.
- [x] **Socket Gateway Status:** Query `https://socket.kovari.in/` and verify it returns `Socket server running`.
- [x] **Verify Log Output:** Check Render logs for the socket server to ensure no syntax/runtime errors occurred during startup, and verify Redis adapter connection succeeds.

---

### D. Human QA Protocols (Post-Deployment)
Once verification checks pass, Navneet and Tirth should execute the manual test suite as defined in:
* [`bug-c4b-fix-validation.md`](file:///c:/Users/navne/CSE/DEV/KOVARI/docs/production-qa/phase-1/bug-c4b-fix-validation.md)
* [`bug-c4b-tests-d-e-post-fix-validation.md`](file:///c:/Users/navne/CSE/DEV/KOVARI/docs/production-qa/phase-1/bug-c4b-tests-d-e-post-fix-validation.md)

Verify:
- **Test A:** Normal messaging parity.
- **Test B:** Connection drop outbox replay (exactly one message received, no duplicates).
- **Test C:** High-velocity message ingestion cache validation.
- **Test D:** 15s outbox timeout UI transition.
- **Test E:** Group seen status persistence across reloads/reconnects.
- **Test F:** Network drop lost-ACK simulation (confirm no duplicates appear on receiver's web view or sender's mobile view).

---

## 4. Status Tracking

- **Code Implementation:** `COMPLETE`
- **Database Migration:** `COMPLETE`
- **Backend Deployment:** `COMPLETE`
- **Infrastructure Verification:** `COMPLETE`
- **Human QA Validation:** `VERIFIED PASS`

**Final Status:** `VERIFIED PASS — QA SIGN-OFF COMPLETE`

