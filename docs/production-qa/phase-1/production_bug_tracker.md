# KOVARI — Production Bug Tracker (Phase 1 Audit)

This document registers potential production risks and security discrepancies discovered during the code audit phase.

---

## Identified Potential Production Risks

### 1. Edge Runtime JWT Signature Verification Bypass Fallback
- **Location**: `apps/web/src/lib/auth/jwt.ts` (`verifyAccessToken` & `verifyRefreshToken`)
- **Details**: When running in the Next.js Edge Runtime, standard Node `jsonwebtoken` verification might fail due to missing dependencies. The code catches this and falls back to decoding the token *without verifying signature integrity*.
- **Impact**: **Critical (P0 Security Risk)**. Bypassing signature verification allows anyone to spoof user IDs (`sub` claim) by crafting un-signed JWTs, potentially compromising any endpoint verified in Edge Middleware.
- **Recommended Action**: Implement Web Crypto API (`SubtleCrypto` / `jose` library) for signing/verifying JWTs in the Next.js middleware rather than using raw base64 decoding as a fallback.

### 2. Omitted Clerk Session Revocation for Banned Users
- **Location**: `apps/web/src/middleware.ts`
- **Details**: When checking user status, if a user is soft-deleted, their Clerk session is revoked immediately. However, if a user is banned, they are redirected to `/banned` but their Clerk session is *not* revoked.
- **Impact**: **High (P0 Moderation Risk)**. Banned users can continue to make direct API calls with their active JWT access tokens until they expire (up to 1 hour), bypassing front-end UI redirects.
- **Recommended Action**: Trigger Clerk's session revocation endpoint immediately upon detecting a ban.

### 3. Missing Server-Side Onboarding Gate
- **Location**: `apps/web/src/shared/components/protected-route.tsx`
- **Details**: The check for onboarding completion is client-side only. There is no backend middleware gate in `middleware.ts` or user resolver (`resolveUser.ts`) validating that `onboarding_completed` is true.
- **Impact**: **Medium (P1 UX Bypass Risk)**. Users can bypass the onboarding route by manually navigating to `/explore` or other app paths via direct URL entry, calling backend APIs with unpopulated profile fields.
- **Recommended Action**: Add onboarding validation status check to `resolveUser` for protected routes.

### 4. Admin Panel Mock Dependency Import Error
- **Location**: `apps/admin` (Vitest Suite)
- **Details**: Testing runs fail with `Error: Do not import lib/redis in client code. Use server APIs instead.` coming from `packages/api`.
- **Impact**: **Medium (P2 Developer Velocity Risk)**. Prevents running automated unit tests for administrative authorization functions.
- **Recommended Action**: Refactor admin Redis client imports to run exclusively inside node-only scopes.
