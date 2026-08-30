# BUG-A10 — Deleted Account Re-login Fix Validation

> **Status:** ROUND 2 FIX IMPLEMENTED — **pending physical-device production QA (Scenario C re-test)**  
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

### Round 2 (Scenario C still failing)

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
| `loginCredentials.test.ts` | **7/7 PASS** (Round 2) |

---

## 4. Manual Production QA

Use a **disposable QA account**. **Backend must be deployed** before testing — no new APK required for server-side fixes; mobile navigation fix needs a new APK build.

### Round 1 QA (2026-08-30)

| # | Scenario | Expected | Result |
| :--- | :--- | :--- | :--- |
| A | Normal login | Active account succeeds | **PASS** |
| B | Delete account | Deletion completes → Login screen | **PASS** |
| C | Re-login after delete | 401, deleted message, no session, no Onboarding | **FAIL** — still logged in → Onboarding |
| D | Auth regression | Login/signup/OTP/logout/session/reset still work | **PASS** |

### Round 2 QA (after deploy)

| # | Scenario | Expected | Result |
| :--- | :--- | :--- | :--- |
| A | Normal login | Active account succeeds | **PENDING** |
| B | Delete account | Deletion completes → Login screen | **PENDING** |
| C | Re-login after delete | 401, deleted message, no session, no Onboarding | **PENDING** |
| D | Auth regression | Login/signup/OTP/logout/session/reset still work | **PENDING** |

### Scenario D must include

- BUG-A7 cold + background reset deep link (sanity)
- BUG-A8 full reset lifecycle (sanity)

### Scenario C notes

- Use **email/password** login (not Google) unless explicitly testing OAuth.
- Tombstone is written on **new** deletions after Round 2 deploy. Re-delete the QA account after deploy so the audit log contains `details.deletedEmail`.
- Expected UI: snackbar or error with *Account not found or has been deleted.* — must **not** reach Onboarding.

---

## 5. Sign-Off

Mark **VERIFIED PASS — QA SIGN-OFF COMPLETE** only after Round 2 Scenarios A–D pass on physical production APK (with Round 2 backend + mobile build deployed).
