# BUG-A10 — Deleted Account Re-login Fix Validation

> **Status:** FIX IMPLEMENTED — **pending physical-device production QA**  
> **Date:** 2026-08-30  
> **Forensic reference:** `bug-a10-forensic-report.md`

---

## 1. Root Cause

Login queries in `/api/auth/login` did not filter `isDeleted = false`, allowing soft-deleted users with lingering credentials to authenticate.

---

## 2. Fix Summary

| Change | File |
| :--- | :--- |
| `isDeleted = false` on email login lookup | `login/route.ts` (web + mobile paths) |
| Deleted-account rejection helper | `loginCredentials.ts`, `deleted-account.ts` |
| Google login deleted guard | `google/route.ts` |

**Expected error:** `Account not found or has been deleted.`

---

## 3. Automated Tests

| Suite | Result |
| :--- | :--- |
| `loginCredentials.test.ts` | **6/6 PASS** |

---

## 4. Manual Production QA

Use a **disposable QA account**.

| # | Scenario | Expected | Result |
| :--- | :--- | :--- | :--- |
| A | Normal login | Active account succeeds | **PENDING** |
| B | Delete account | Deletion completes → Login screen | **PENDING** |
| C | Re-login after delete | 401, deleted message, no session, no Onboarding | **PENDING** |
| D | Auth regression | Login/signup/OTP/logout/session/reset still work | **PENDING** |

### Scenario D must include

- BUG-A7 cold + background reset deep link (sanity)
- BUG-A8 full reset lifecycle (sanity)

---

## 5. Sign-Off

Mark **VERIFIED PASS — QA SIGN-OFF COMPLETE** only after Scenarios A–D pass on physical production APK.
