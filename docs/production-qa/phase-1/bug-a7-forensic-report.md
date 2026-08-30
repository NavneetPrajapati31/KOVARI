# BUG-A7 — Mobile Password Reset Deep Link Forensic Report

> **Status:** **VERIFIED PASS — QA SIGN-OFF COMPLETE**  
> **Date:** 2026-08-30 (forensic: 2026-08-29; QA sign-off: 2026-08-30)  
> **Severity:** P1  
> **Validation:** `bug-a7-fix-validation.md`

---

## A. Executive Summary

**Symptom:** Reset email link does not open KOVARI on `/reset-password` with token preserved (cold start and warm/background).

**Updated finding:** The tracker conclusion that **`app_links` was missing is outdated**. `app_links` is in `pubspec.yaml` and `router.dart` already registered `uriLinkStream` + `getInitialLink`.

**Root causes (three rounds):**

| Round | First failed stage | Fix |
| :--- | :--- | :--- |
| **1** | Custom-scheme URI resolution — handler required non-empty `uri.path`; `kovari://reset-password` uses host, not path | `resolveDeepLinkLocation()` |
| **2** | `routerProvider` recreated `GoRouter` on auth refresh → warm links lost on resume | Stable router via `ref.read(notifier)` |
| **3** | Permanent URI dedup blocked re-taps; `router.go` from login lost to restoration; resume poll ran before bootstrap | `DeepLinkRouter`, `BackgroundGovernor` resume poll, `router.push` on auth screens |

**Production QA (2026-08-30):** Scenarios A–D, F **PASS** on physical device. E skipped.

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
[Round 1 BUG] path.isEmpty → no navigation ❌
      ↓
[FIX] resolveDeepLinkLocation → /reset-password?token=... ✅
      ↓
[Round 2–3] cold: getInitialLink + delay; warm: stream + resume poll + push ✅
      ↓
ResetPasswordRouteData → ResetPasswordScreen ✅
      ↓
POST reset-password → login with new password ✅ (BUG-A8 lifecycle)
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
| Custom scheme → GoRouter path | ✅ fixed (Round 1) |
| Cold-start deep link | ✅ verified (Scenario B) |
| Background/warm deep link | ✅ verified (Scenario C, Round 3) |
| `ResetPasswordRouteData` | ✅ reads `token` query param |
| Auth guard for `/reset-password` | ✅ public auth page when logged out |
| Full reset lifecycle | ✅ verified (Scenario D → BUG-A8) |

---

## D. Root Cause (Round 1 — primary)

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

## E. Fix Implemented (all rounds)

| File | Change |
| :--- | :--- |
| `deep_link_resolver.dart` | **New** — `resolveDeepLinkLocation`, `sanitizeDeepLinkForLog` |
| `deep_link_router.dart` | **New** — dedup, warm `push`, resume poll, lifecycle bridge |
| `router.dart` | Resolver + stable GoRouter + stream binder |
| `router_notifier.dart` | Sanitize `kovari://` in redirect guard |
| `background_governor.dart` | Resume deep-link poll after foreground |
| `MainActivity.kt` | `onNewIntent` + `setIntent` |
| `deep_link_resolver_test.dart` | 7 unit tests |
| `deep_link_router_test.dart` | 4 unit tests |
| `api_client.dart` | 401 client errors surfaced to AuthService (login UX) |
| `auth_service.dart` / `api_error_handler.dart` | User-facing invalid-credentials message |

**Not modified:** Backend reset-token generation, G2/G2b/G3 delivery stack.

---

## F. Security

- Reset tokens **not logged** (sanitized as `[REDACTED]`)
- Missing token → no navigation
- Unknown `kovari://` hosts → ignored
- Token not persisted beyond reset flow

---

## G. Production QA Sign-Off

See `bug-a7-fix-validation.md`.

| Scenario | Result |
| :--- | :--- |
| A — Request reset email | **PASS** |
| B — Cold-start deep link | **PASS** |
| C — Background deep link | **PASS** |
| D — Complete reset + login | **PASS** |
| E — Invalid/expired token | **SKIPPED** |
| F — Auth regression | **PASS** |

**BUG-A7 — VERIFIED PASS — QA SIGN-OFF COMPLETE** (2026-08-30)

---

## H. BUG-A8 (Password Reset Lifecycle)

**Status:** **VERIFIED PASS** — validated via Scenario D on the same Round 3 production APK (2026-08-30).

Full lifecycle confirmed: forgot-password email → deep link (cold + background) → reset screen → new password → email login success.

Regression matrix scenario **A8** updated to **PASS** in `mobile_regression_matrix.md`.
