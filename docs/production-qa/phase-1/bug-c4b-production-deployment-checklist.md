# BUG-C4b Production Deployment Checklist

This checklist tracks the deployment and verification of the **BUG-C4b (Intermittent Realtime Chat Message Delivery Failures)** fix to the production environment. 

---

## 1. Commit and Branch State

| Parameter | Value | Status |
| :--- | :--- | :--- |
| **BUG-C4b Fix Commit** | `0089a2ba` | `IMPLEMENTED IN REPOSITORY (dev)` |
| **Source Branch** | `dev` | `READY` |
| **Production Branch** | `master` | `AWAITING DEPLOYMENT / PROMOTION` |
| **Production Target Commit** | `0089a2ba` (needs merge/promotion) | `PENDING` |

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
* **Status:** `IMPLEMENTED IN REPOSITORY` (not yet applied to production database).
* **Action:** Run the SQL snippet above via the **Supabase Dashboard SQL Editor** for the production database `belgecmnlvypuhqjztho.supabase.co`.

---

### B. Backend Deployment
* **Service:** Production Socket Service
* **Target Host:** Render (`socket.kovari.in` / `kovari-socket.onrender.com`)
* **Branch Deployed:** `master`
* **Impacted Code:** `apps/web/src/services/socket/events.ts` (affects standalone Socket server, Next.js web application imports only `services/socket/redis.ts` for publish/subscribe triggers, so both build paths must be updated).
* **Status:** `IMPLEMENTED IN REPOSITORY` (code exists on `dev`, but not on `master` or Render production server).
* **Action:**
  1. Merge/promote `0089a2ba` from `dev` to `master`.
  2. Trigger deployment on Render for `kovari-socket` and the main Next.js app (`kovari-web` / `app.kovari.in`).

---

## 3. Production Verification Plan

### C. Automated / Infrastructure Verification (Post-Deployment)
Verify these checks before handing off to the QA operators:

- [ ] **Socket Server Health Check:** Query `https://socket.kovari.in/health` and verify it returns `{ "status": "ok" }`.
- [ ] **Socket Gateway Status:** Query `https://socket.kovari.in/` and verify it returns `Socket server running`.
- [ ] **Verify Log Output:** Check Render logs for the socket server to ensure no syntax/runtime errors occurred during startup, and verify Redis adapter connection succeeds.

---

### D. Human QA Protocols (Post-Deployment)
Once verification checks pass, Navneet and Tirth should execute the manual test suite as defined in:
* [`bug-c4b-fix-validation.md`](file:///c:/Users/navne/CSE/DEV/KOVARI/docs/production-qa/phase-1/bug-c4b-fix-validation.md)

Verify:
- **Test A:** Normal messaging parity.
- **Test B:** Connection drop outbox replay (exactly one message received, no duplicates).
- **Test C:** High-velocity message ingestion cache validation.
- **Test D:** 15s outbox timeout UI transition.
- **Test F:** Network drop lost-ACK simulation (confirm no duplicates appear on receiver's web view or sender's mobile view).

---

## 4. Status Tracking

- **Code Implementation:** `IMPLEMENTED IN REPOSITORY` (Commit: `0089a2ba` on `dev`)
- **Database Migration:** `PENDING DEPLOYMENT` (Awaiting Supabase execution)
- **Backend Deployment:** `PENDING DEPLOYMENT` (Awaiting Render promotion to `master`)
- **Infrastructure Verification:** `PENDING VERIFICATION`
- **Human QA Validation:** `PENDING VALIDATION`

**Final Status:** `FULL FIX IMPLEMENTED — PRODUCTION DEPLOYMENT + HUMAN QA REQUIRED`
