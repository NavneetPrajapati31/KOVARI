# BUG-A10 — Deleted Account Re-login Fix Validation

> **Status:** **VERIFIED PASS — QA SIGN-OFF COMPLETE**  
> **Date:** 2026-08-30  
> **Forensic reference:** `bug-a10-forensic-report.md`

---

## 1. Root Cause

Login queries in `/api/auth/login` did not filter deleted accounts. After GDPR deletion nullifies `users.email`, login could not match the soft-deleted row and `sync_user_identity` (Google OAuth) could reactivate or recreate identity for the same email.

---

## 2. Fix Summary

### Round 1 (`54472d24`)

| Change | File |
| :--- | :--- |
| `isDeleted = false` on email login lookup | `login/route.ts` (web + mobile paths) |
| Deleted-account rejection helper | `loginCredentials.ts`, `deleted-account.ts` |
| Google login deleted guard | `google/route.ts` |

### Round 2 (`31d65bcb`) — Scenario C fix

| Change | File |
| :--- | :--- |
| Login lookup without PostgREST filter + explicit deleted evaluation | `loginCredentials.ts`, `login/route.ts` |
| Deleted-email tombstone in `ACCOUNT_DELETED` audit log | `delete-account/route.ts` |
| Tombstone check when no active user row matches | `login/route.ts`, `google/route.ts` |
| Block Google sync before RPC when tombstone/deleted row found | `google/route.ts` |
| Post-delete navigation → Login (not Onboarding) | `settings_screen.dart` |

**Expected error:** `Account not found or has been deleted.`

---

## 3. Automated Tests

| Suite | Result |
| :--- | :--- |
| `loginCredentials.test.ts` | **7/7 PASS** |

---

## 4. Manual Production QA

Use a **disposable QA account**. Round 2 backend + mobile build deployed before re-test.

### Round 2 QA (2026-08-30) — **SIGN-OFF**

| # | Scenario | Expected | Result |
| :--- | :--- | :--- | :--- |
| A | Normal login | Active account succeeds | **PASS** |
| B | Delete account | Deletion completes → Login screen | **PASS** |
| C | Re-login after delete | 401, deleted message, no session, no Onboarding | **PASS** |
| D | Auth regression | Login/signup/OTP/logout/session/reset still work | **PASS** |

Scenario D included BUG-A7 cold + background reset deep link sanity and BUG-A8 full reset lifecycle sanity.

---

## 5. Sign-Off

**BUG-A10 — VERIFIED PASS — QA SIGN-OFF COMPLETE** (2026-08-30)

---

## 6. QA History (prior rounds)

### Round 1 QA (2026-08-30, commit `54472d24`)

| # | Result | Notes |
| :--- | :--- | :--- |
| A | **PASS** | |
| B | **PASS** | |
| C | **FAIL** | Still logged in → Onboarding |
| D | **PASS** | |

Round 2 fix required for Scenario C after post-delete email nullification broke login lookup and Google sync could reactivate identity.
