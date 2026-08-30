# BUG-A7 — Password Reset Deep Link Fix Validation

> **Status:** **VERIFIED PASS — QA SIGN-OFF COMPLETE**  
> **Date:** 2026-08-30  
> **Forensic reference:** `bug-a7-forensic-report.md`

---

## 1. Root Cause

**Round 1:** Host-based `kovari://reset-password` URIs dropped (`uri.path` empty).

**Round 2:** `GoRouter` recreated on auth refresh; warm links lost on resume.

**Round 3:** Permanent URI dedup blocked re-taps; `router.go` from login competed with state restoration; resume polling ran before auth/bootstrap finished.

---

## 2. Fix Summary

| Change | File |
| :--- | :--- |
| Host-based URI resolver | `deep_link_resolver.dart` |
| Stable single `GoRouter` | `router.dart` |
| Short-window dedup + force poll on resume | `deep_link_router.dart` |
| Resume handling via `BackgroundGovernor` (700ms after foreground) | `background_governor.dart` |
| Warm auth screens use `router.push` instead of `go` | `deep_link_router.dart` |
| Android `onNewIntent` | `MainActivity.kt` |
| Login 401 surfaces API message (`Invalid credentials`) | `api_client.dart`, `auth_service.dart`, `api_error_handler.dart` |

---

## 3. Production QA — Final Sign-Off (Round 3 APK)

| # | Scenario | Expected | Result |
| :--- | :--- | :--- | :--- |
| A | Request reset email | Email arrives with mobile link | **PASS** |
| B | Cold-start deep link | App opens → Reset Password with token | **PASS** |
| C | Background deep link | App on login → tap link → Reset Password | **PASS** |
| D | Complete reset + login | New password works | **PASS** |
| E | Invalid/expired token | Existing error UI shown | **SKIPPED** |
| F | Auth regression | Login/signup/OTP/logout OK | **PASS** |

---

## 4. Automated Tests

| Suite | Result |
| :--- | :--- |
| `deep_link_resolver_test.dart` | **7/7 PASS** |
| `deep_link_router_test.dart` | **4/4 PASS** |

---

## 5. Sign-Off

**BUG-A7 — VERIFIED PASS — QA SIGN-OFF COMPLETE** (2026-08-30)

**BUG-A8** (password reset lifecycle) **VERIFIED PASS** via Scenario D on the same build. Regression matrix A8 updated to **PASS**.

---

## 6. QA History (prior rounds)

### Round 2 APK (`b7ad91aa`)

| # | Result | Notes |
| :--- | :--- | :--- |
| A | **PASS** | |
| B | **PASS** | Cold start |
| C | **FAIL** | Background → stuck on login |
| D | **PASS** | Reset + email login |
| E | **SKIPPED** | |
| F | **PASS** | Google login |

**Login UX note:** Wrong password showed `Exception: email login failed` — partial fix in Round 3 (shows `Invalid credentials`). Full auth error handling remains **BUG-A1**.
