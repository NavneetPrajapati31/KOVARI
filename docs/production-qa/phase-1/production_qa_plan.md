# KOVARI — Production QA Plan (Phase 1)

This plan outlines the End-to-End Production QA & Regression Validation strategy for KOVARI pre-beta release. It aligns manual verification steps across Web, Backend, and Mobile platforms to guarantee regression protection.

---

## 1. Objectives & Scope
- **Verification of Parity**: Verify that the production systems (Web, Go Matching Backend, Next.js Server, Supabase, Redis, and Firebase FCM) match the client behavior implemented in Flutter and React.
- **E2E Validation**: Run real journey paths to ensure zero data loss, secure authorization boundaries, and robust realtime synchronization.
- **Strictly Read-Only**: This plan is based on a code-level audit of the active codebase. No application code has been modified.

---

## 2. Recommended Execution Order
To minimize state corruption and maximize testing efficiency, execute tests in this logical sequence:
1. **Infrastructure & Environment Validation**: Perform health check pings and verify SSL pinning / CORS policies.
2. **Authentication & Onboarding**: Bootstrap normal and internal test users. Complete profile onboarding.
3. **Profile & Media Uploads**: Verify persistence of profiles and Cloudinary media uploads.
4. **Safety & Blocking**: Verify report/block states before matching (to ensure exclusion lists are active).
5. **Explore & Matching**: Validate recommendation feeds, solo matches, and group recommendations.
6. **Realtime Chat & Group Collaboration**: Verify Socket.io connection, room join, encrypted direct messaging, and itinerary sync.
7. **Push Notifications**: Trigger notifications under background, foreground, and cold-start app states.
8. **Destructive Operations**: Test password reset, email changes, and account deletion at the very end to avoid test account churn.

---

## 3. Critical Production Journeys
1. **User Sign Up ➔ Onboarding ➔ Profile Matching**: Ensures first-time users can join the platform, setup their profile, and immediately receive valid matching recommendations.
2. **Match Match ➔ Direct Chat Hookup**: Ensures that when user A likes user B, and user B likes user A, a direct chat channel is created, Socket.io presence registers both online, and encrypted chats function seamlessly.
3. **Group Collaboration & Shared Itinerary**: Group creator initiates a group, invites members, updates the live travel itinerary, and uploads media files with automatic realtime notifications sent to members.

---

## 4. Test Account Matrix
These dedicated test accounts must be pre-configured on Supabase / Clerk. Do not write automated scripts to register these; they must be manually managed.

| Account Identifier | Purpose / Persona | Setup Prerequisites |
| :--- | :--- | :--- |
| **Normal User A** | Standard flows, match receiver | Onboarded, public profile, valid coordinates |
| **Normal User B** | Standard flows, match initiator | Onboarded, public profile, matching filters overlapping A |
| **Internal User A** | Internal testing isolation | `is_internal = true` in Supabase `users` |
| **Internal User B** | Internal matching isolation | `is_internal = true` in Supabase `users` |
| **Group Creator** | Group management testing | Standard onboarded user |
| **Group Admin** | Group permission testing | Joined group, promoted to Admin |
| **Pending Member** | Membership approval testing | Standard user, requested to join Creator's group |
| **Blocked User** | Safety boundary testing | Standard user, blocked by Normal User A |
| **Banned User** | Moderation testing | Flagged as `banned = true` and `ban_expires_at` in future |

---

## 5. Required Production Data
- **Geocoding Data**: Valid travel destinations (coordinates and city names) matching Geoapify database records.
- **Mock FCM Tokens**: Active FCM registration tokens from real iOS/Android test devices.
- **Mock Cloudinary Signatures**: Preset credentials matching `kovari_unsigned` preset policies.

---

## 6. Highest-Risk Areas Identified
1. **JWT Signature Bypass in Edge Runtime**: In `verifyAccessToken` (`apps/web/src/lib/auth/jwt.ts`), there is a fallback to decode payloads *without* verifying signature if the Node crypto library is missing (which happens in Next.js Edge Runtime middleware). This is a critical security vulnerability.
2. **Missing Server-Side Onboarding Gate**: The check for onboarding completion is client-side only in React/Flutter. Bypassing the router allows un-onboarded users to call authenticated API endpoints.
3. **Omission of Clerk Session Revocation for Bans**: The middleware redirects banned users to `/banned` but does not revoke their Clerk session. Until the JWT expires (up to 1 hour), the user can continue executing requests if they call APIs directly.
4. **Token Refresh Connectivity Blips**: On mobile, network switching during an active token refresh might trigger a logout if the status code return is misclassified. The circuit breaker must be rigorously verified under bad network conditions.
