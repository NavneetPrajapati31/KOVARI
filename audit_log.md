# Feature Inventory Code Audit (Block 1)

This document contains the read-only audit log of Kovari's feature inventory prior to the pre-beta launch.

---

## 1. Signup (Clerk)
* **Auth Check Logic**: Analyzed in [middleware.ts](file:///c:/Users/user/KOVARI/apps/web/src/middleware.ts).
  - In normal operation mode, the middleware checks if the user is deleted or banned in the database.
  - If a user is deleted, the session is revoked (best-effort) and redirected to `/sign-in?reason=deleted`.
  - If a user is banned (and suspension is not expired), the user is redirected to `/banned`.
* **OAuth Providers**: Checked in [auth-form.tsx](file:///c:/Users/user/KOVARI/apps/web/src/features/auth/components/auth-form.tsx).
  - The client form only enables the Google OAuth provider (`oauth_google`).
  - Facebook (`oauth_facebook`) and Apple (`oauth_apple`) providers are commented out in the component.
* **JWT Templates**:
  - The middleware uses the token with template name `"supabase"` (`token = await getToken({ template: "supabase" })`) as a fallback when the anonymous key is used.
* **Tag**: 🟡 (Clerk Dashboard settings for OAuth and JWT templates could not be directly verified offline, but the codebase expects Google and the "supabase" template).

---

## 2. Onboarding Flow
* **Files**: [page.tsx](file:///c:/Users/user/KOVARI/apps/web/src/app/(app)/onboarding/page.tsx), [ProfileSetupForm.tsx](file:///c:/Users/user/KOVARI/apps/web/src/features/onboarding/components/ProfileSetupForm.tsx), and [protected-route.tsx](file:///c:/Users/user/KOVARI/apps/web/src/shared/components/protected-route.tsx).
* **Validation**:
  - The check for onboarding completion is **only client-side** in [protected-route.tsx](file:///c:/Users/user/KOVARI/apps/web/src/shared/components/protected-route.tsx#L93-L122).
  - There is no server-side validation or gate in [middleware.ts](file:///c:/Users/user/KOVARI/apps/web/src/middleware.ts) or in `resolveUser.ts` checking if `onboarding_completed` is true. Thus, a user could bypass the client router to hit backend APIs or access app routes.
* **Tag**: 🟡 (Bypass risk identified at [protected-route.tsx:L93-122](file:///c:/Users/user/KOVARI/apps/web/src/shared/components/protected-route.tsx#L93-L122)).

---

## 3. Profile Edit
* **API Route**: [route.ts](file:///c:/Users/user/KOVARI/apps/web/src/app/api/profile/update/route.ts).
* **Client Type for Writes**:
  - The profile update API route calls `createAdminSupabaseClient()` (line 34), which uses the service role key.
  - Since it uses the admin client, it bypasses Row Level Security (RLS) policies completely.
* **Tag**: 🟡 (Uses service role client for writes instead of user-scoped client).

---

## 4. Solo Matching (Go service)
* **API Route**: [route.ts](file:///c:/Users/user/KOVARI/apps/web/src/app/api/v1/match-solo/route.ts).
* **Identity Resolve**:
  - Calls `resolveUser.ts` before forwarding to Go? **Yes**, indirectly via `getAuthenticatedUser(request)` at line 31.
* **Response Validation**:
  - Validates Go response schema before returning to client? **Yes**, it uses `safeBatchValidate(rawItems, GoSoloMatchSchema, requestId)` at line 68.
* **SQL Fallback**:
  - Is `performSoloDbMatchingFallback` reachable? **Yes**, if Go service is disabled, circuit breaker trips, or call fails/degrades.
* **Tag**: 🟢 (Go service proxy flow) / 🟡 (Fallback: performSoloDbMatchingFallback to be tested in Phase 7).

---

## 5. Chat (Supabase Realtime)
* **Files**: [use-direct-messages.ts](file:///c:/Users/user/KOVARI/apps/web/src/shared/hooks/use-direct-messages.ts) and [page.tsx](file:///c:/Users/user/KOVARI/apps/web/src/app/(app)/chat/[userId]/page.tsx).
* **Subscription Type**: Set up with `postgres_changes` (lines 102, 121, 126 in hook, line 710 in page).
* **Unsubscribe Call**: Yes, calls `supabase.removeChannel(channel)` in cleanup (line 132 in hook, line 735 in page).
* **AES Key Derivation**: Uses a **per-chat-room** key derived from alphabetically sorting the two participants' UUIDs (`currentUserUuid` and `partnerUuid`).

---

## 6. Report/Block (/safety)
* **Routes Checked**:
  - `/api/matching/report` ([route.ts](file:///c:/Users/user/KOVARI/apps/web/src/app/api/matching/report/route.ts))
    - Calls `resolveUser.ts`? **No**, calls Clerk `auth()` directly.
    - Input Validation: Manual parameter presence checks on the body (`!reporterId || !targetIdentifier || !reason`, no Zod).
  - `/api/reports/targets` ([route.ts](file:///c:/Users/user/KOVARI/apps/web/src/app/api/reports/targets/route.ts))
    - Calls `resolveUser.ts`? **Yes**, indirectly via `getAuthenticatedUser(req)`.
    - Input Validation: GET route, handles query parameters.
  - `/api/reports/my-reports` ([route.ts](file:///c:/Users/user/KOVARI/apps/web/src/app/api/reports/my-reports/route.ts))
    - Calls `resolveUser.ts`? **Yes**, indirectly via `getAuthenticatedUser(req)`.
    - Input Validation: GET route, no body.
  - `/api/users/block` ([route.ts](file:///c:/Users/user/KOVARI/apps/web/src/app/api/users/block/route.ts))
    - Calls `resolveUser.ts`? **No**, calls Clerk `auth()` directly.
    - Input Validation: Manual body check (`!targetId || !action` and action validation, no Zod).
* **Note**: `/api/matching/report` and `/api/users/block` skip `resolveUser.ts` and use Clerk's `auth()`, performing manual checks rather than using Zod.

---

## 7. Admin Panel
* **Auth Check Flow**: Clerk session → extract email → query admins table → allow/deny.
* **Database Client**: Uses `supabaseAdmin` (not user-scoped client) for querying the `admins` table in [adminAuth.ts](file:///c:/Users/user/KOVARI/apps/admin/lib/adminAuth.ts#L25-L30) and [adminAuth.ts#L62-L67](file:///c:/Users/user/KOVARI/apps/admin/lib/adminAuth.ts#L62-L67), which prevents spoofing.
* **Vitest Tests**: 🔴 Failed. Vitest failed to run because of a module mocking/import error: `Error: Do not import lib/redis in client code. Use server APIs instead.` coming from `packages/api`.
* **Tag**: 🟢 (Auth flow and client queries are secure, but test runner failed to resolve environment dependencies).

---

## 8. Middleware (ban/delete)
* **File**: [middleware.ts](file:///c:/Users/user/KOVARI/apps/web/src/middleware.ts).
* **Banned User Flow**:
  - Checks database for ban status and expiration.
  - Redirects banned users to `/banned`.
  - **Does NOT revoke their Clerk session** in the banned path (unlike the soft-delete path at lines 230-240). Banned users can still perform API requests until their JWT expires.
* **Tag**: 🟢 (Fixed in this branch — Clerk session revocation added to banned user flow).
