# BUG-A7 — Password Reset Deep Link Fix Validation

> **Status:** FIX IMPLEMENTED — **pending physical-device production QA**  
> **Date:** 2026-08-29  
> **Forensic reference:** `bug-a7-forensic-report.md`

---

## 1. Root Cause

Custom-scheme reset links (`kovari://reset-password?token=...`) were received by `app_links` but dropped because the handler required a non-empty `uri.path`. Host-based routing was missing.

---

## 2. Fix Summary

| Change | File |
| :--- | :--- |
| Map `kovari://reset-password?token=` → `/reset-password?token=` | `deep_link_resolver.dart` |
| Cold-start + runtime link handling via shared resolver | `router.dart` |
| `kovari://` sanitization in auth redirect guard | `router_notifier.dart` |
| Token redaction in deep-link logs | `deep_link_resolver.dart` |

---

## 3. Automated Tests

| Suite | Result |
| :--- | :--- |
| `deep_link_resolver_test.dart` | **7/7 PASS** |
| Full `flutter test` | **63/63 PASS** (2026-08-29) |
| `flutter analyze lib` | Pre-existing info/warnings only; no new errors in A7 files |

---

## 4. Manual Production QA

| # | Scenario | Expected | Result |
| :--- | :--- | :--- | :--- |
| A | Request reset email | Email arrives with mobile link | **PENDING** |
| B | Cold-start deep link | App opens → Reset Password with token | **PENDING** |
| C | Background deep link | App → Reset Password | **PENDING** |
| D | Complete reset + login | New password works | **PENDING** |
| E | Invalid/expired token | Existing error UI shown | **PENDING** |
| F | Auth regression | Login/signup/OTP/logout OK | **PENDING** |

---

## 5. Sign-Off

Mark **VERIFIED PASS** only after Scenarios A–F pass on physical production APK.

**BUG-A8** unblocked after Scenario D passes.
