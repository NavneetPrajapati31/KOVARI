# BUG-A7 — Mobile Password Reset Deep Link Forensic Report

> **Status:** FORENSIC COMPLETE — fix implemented (pending production QA)  
> **Date:** 2026-08-29  
> **Severity:** P1

---

## A. Executive Summary

**Symptom:** Reset email link does not open KOVARI on `/reset-password` with token preserved.

**Updated finding:** The tracker conclusion that **`app_links` was missing is outdated**. `app_links` is in `pubspec.yaml` and `router.dart` already registers `uriLinkStream` + `getInitialLink`.

**Actual first failed stage:** Custom-scheme URI resolution in `router.dart` — handler only routed when `uri.path.isNotEmpty`. For `kovari://reset-password?token=...`, **`uri.path` is empty** (host carries `reset-password`), so the listener **silently dropped** the link.

**Minimal fix:** `resolveDeepLinkLocation()` maps `kovari://reset-password?token=` → `/reset-password?token=`; cold-start delay aligned with FCM pattern; token redacted in logs.

---

## B. Flow Trace

```text
Forgot Password (mobile)
      ↓
POST forgot-password (platform: mobile)
      ↓
Email: kovari://reset-password?token=<TOKEN>
      ↓
Android intent-filter (scheme=kovari, host=reset-password) ✅
      ↓
app_links → Uri (host=reset-password, path="", query token) ✅
      ↓
router.dart deep-link handler
      ↓
[BUG] path.isEmpty → no navigation ❌
      ↓
[FIX] resolveDeepLinkLocation → /reset-password?token=... ✅
      ↓
ResetPasswordRouteData → ResetPasswordScreen ✅
```

---

## C. Component Verification

| Layer | Status |
| :--- | :--- |
| Backend link (`forgot-password/route.ts`) | ✅ `kovari://reset-password?token=` when mobile |
| Mobile `AuthService` platform flag | ✅ sends `platform: mobile` |
| `AndroidManifest.xml` intent-filter | ✅ `kovari` + host `reset-password` |
| `app_links` package | ✅ present (`^6.3.0`) |
| AppLinks listeners | ✅ existed pre-fix |
| Custom scheme → GoRouter path | ❌ **broken pre-fix** |
| `ResetPasswordRouteData` | ✅ reads `token` query param |
| Auth guard for `/reset-password` | ✅ public auth page when logged out |

---

## D. Root Cause

**File:** `apps/mobile/lib/core/navigation/router.dart` (pre-fix)

```dart
var path = uri.path;
if (path.isNotEmpty) { /* route */ }
```

For RFC 3986 custom schemes, `kovari://reset-password?token=X` parses as:

- `scheme`: `kovari`
- `host`: `reset-password`
- `path`: `` (empty)
- `queryParameters`: `{token: X}`

The handler never entered the routing block.

---

## E. Fix Implemented

| File | Change |
| :--- | :--- |
| `deep_link_resolver.dart` | **New** — `resolveDeepLinkLocation`, `sanitizeDeepLinkForLog` |
| `router.dart` | Use resolver; 500ms cold-start delay; redacted logging |
| `router_notifier.dart` | Sanitize `kovari://` in redirect guard |
| `deep_link_resolver_test.dart` | **New** — 7 unit tests |

**Not modified:** Backend, `AuthService`, login/signup, G2/G2b/G3.

---

## F. Security

- Reset tokens **not logged** (sanitized as `[REDACTED]`)
- Missing token → no navigation
- Unknown `kovari://` hosts → ignored

---

## G. Manual QA Required

See `bug-a7-fix-validation.md` — Scenarios A–F on physical production APK.

---

## H. BUG-A8

Remains **blocked** until complete password-reset lifecycle verified on device.
