# BUG-A10 — Deleted Account Re-login Forensic Report

> **Status:** FIX IMPLEMENTED — **pending physical-device production QA**  
> **Date:** 2026-08-30  
> **Severity:** P2

---

## A. Executive Summary

**Symptom:** After account deletion, re-login with previous email/password succeeds and redirects to Onboarding instead of rejecting the session.

**First failed stage (confirmed):** `/api/auth/login` user lookup — both web and mobile paths queried `users` by email **without** `isDeleted = false`, allowing soft-deleted rows that still retain credentials to authenticate.

**Defence already present elsewhere:** `resolveUser.ts`, middleware, and `sync-user/route.ts` check `isDeleted`; the **password login paths did not**.

---

## B. Flow Trace

```text
Delete account (POST /api/settings/delete-account)
      ↓
users.isDeleted = true
users.email = null
users.password_hash = null
      ↓
Re-login POST /api/auth/login
      ↓
[BUG] SELECT ... WHERE email ILIKE $email   (no isDeleted filter)
      ↓
If row still has credentials (partial/race/legacy) → tokens issued → Onboarding
      ↓
[FIX] .eq("isDeleted", false) + evaluatePasswordLogin deleted guard
      ↓
401 Account not found or has been deleted.
```

---

## C. Account Deletion Verification

**File:** `apps/web/src/app/api/settings/delete-account/route.ts`

| Field | On delete |
| :--- | :--- |
| `isDeleted` | `true` |
| `email` | `null` |
| `password_hash` | `null` |
| `clerk_user_id` | `null` |
| Refresh tokens | deleted |

Deletion semantics were **not modified** in this fix.

---

## D. Root Cause

| Path | Pre-fix |
| :--- | :--- |
| Web login (`client === "web"`) | No `isDeleted` filter |
| Mobile login (`handleStandardLogin`) | No `isDeleted` filter |
| Google login (`/api/auth/google`) | No post-sync `isDeleted` check |

Tracker diagnosis **confirmed** from current code.

---

## E. Fix Implemented

| File | Change |
| :--- | :--- |
| `packages/api/src/auth/deleted-account.ts` | Shared message + `isDeletedLoginUser()` |
| `apps/web/src/lib/auth/loginCredentials.ts` | `evaluatePasswordLogin()` + shared select |
| `apps/web/src/app/api/auth/login/route.ts` | `.eq("isDeleted", false)` on both login paths; deleted-account 401 |
| `apps/web/src/app/api/auth/google/route.ts` | Reject soft-deleted users after identity sync |
| `apps/web/src/lib/auth/loginCredentials.test.ts` | 6 regression tests |

**Not modified:** Account deletion route, signup, OTP, session restore, BUG-A7/A8 deep links.

---

## F. Manual QA Required

See `bug-a10-fix-validation.md` — Scenarios A–D on physical production APK with disposable account.

---

## G. Related Bugs

| Bug | Status |
| :--- | :--- |
| BUG-A7 | **VERIFIED PASS** — do not modify |
| BUG-A8 | **VERIFIED PASS** — do not modify |
