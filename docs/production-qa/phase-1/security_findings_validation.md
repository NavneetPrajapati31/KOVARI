# KOVARI — Security Findings Validation Report (Phase 1)

This report presents a forensic investigation and validation of the three potential security and authorization findings identified prior to starting manual E2E Production QA.

---

## FINDING 1 — JWT SIGNATURE VERIFICATION

### Forensic Analysis
1. **Implementation Audit**: In `apps/web/src/lib/auth/jwt.ts` (lines 59–86), `verifyAccessToken` runs `jwt.verify` (from Node-dependent `jsonwebtoken` library). In standard serverless Node environments, this works correctly.
2. **Edge Fallback Execution**: When executed in the Next.js Edge Runtime (e.g., in Next.js `middleware.ts`), the native Node `crypto` dependency is unavailable, causing `jsonwebtoken` to fail. The catch block then matches the string `"crypto"` or `"Edge"` and falls back to:
   ```typescript
   const payload = JSON.parse(atob(base64));
   if (payload.iss === ISSUER && payload.type === "access" && isUUIDv4(payload.sub)) {
       return payload;
   }
   ```
   This decodes the base64 payload **without verifying the signature**.
3. **Exploitability & Scope**: 
   - **Next.js Middleware**: Runs in Vercel Edge Runtime. It executes `checkMobileJwtBan` which calls `verifyAccessToken`. Because it runs in Edge, it will execute the signature-bypassed fallback. An attacker could craft a fake JWT with a random UUID as the `sub` claim. The middleware's ban check would query Supabase for a ban on that random UUID (which won't exist), and then allow the request to proceed.
   - **API Routes**: Execute in the Serverless Node.js Runtime. All protected API endpoints call `resolveUser`, which invokes `verifyAccessToken`. Since this runs in Node, `jwt.verify` executes successfully and signature verification **is strictly enforced**. Any tampered or unsigned token is rejected at this boundary with a `401 Unauthorized` status.
   - **Socket Server**: Standalone Node.js process. It successfully executes standard signature verification via `jsonwebtoken`. Spoofed tokens are immediately rejected.
4. **Remediation Options**: The library `jose` (v4.15.9) is already present in `apps/web/package.json`. It runs natively in both Node and Edge environments.

### Verdict
**CONFIRMED** (Middleware Level Bypass / Signature Bypass in Edge Runtime)
- **Severity**: High (P0 Security Flaw for Middleware; mitigated to Medium because target API routes execute under Node and verify signatures).
- **Exploitability**: High for bypassing middleware-level checks; Low for obtaining unauthorized data because endpoints execute signature verification.
- **Affected Routes**: Next.js middleware execution path.
- **Recommended Remediation**: Refactor `verifyAccessToken` and `verifyRefreshToken` to use `jose` for cryptographically verifying tokens across both Node and Edge runtimes.

---

## FINDING 2 — BANNED USER SESSION REVOCATION

### Forensic Analysis
1. **Ban Enforcement Lifecycle**:
   - When a user is banned, the backend execution of `enforceBanSideEffects` (in `packages/api/src/moderation/enforce-ban-side-effects.ts`) deletes all corresponding rows in the `refresh_tokens` table.
   - Active WebSocket connections are immediately disconnected by subscribing to the `BAN_SOCKET_CHANNEL` on Redis.
   - The user's active Redis travel sessions and cached push notifications are flushed.
2. **API Verification Gates**:
   - Even if a banned user holds an active mobile access token (valid signature, not yet expired), any request to protected API routes invokes `resolveUser`.
   - `resolveUser` queries the `users` table on Supabase in real-time (`assertNotBanned`).
   - If the user is flagged as banned, the API route rejects the call immediately.
   - Therefore, the active JWT cannot be used to execute protected API operations post-ban.
3. **Clerk Session Revocation**:
   - The Next.js middleware successfully attempts to revoke the Clerk session for Web clients during non-public route checks.

### Verdict
**FALSE POSITIVE**
- **Severity**: Low (No action required).
- **Exploitability**: Non-exploitable. Active access tokens are blocked in real-time at the API route database gate.

---

## FINDING 3 — SERVER-SIDE ONBOARDING ENFORCEMENT

### Forensic Analysis
1. **Onboarding Context**: Onboarding completion is enforced on the client side (`protected-route.tsx` and GoRouter config).
2. **Endpoint Behavior**:
   - `/api/match-solo`: Fails for un-onboarded users because `ensureSessionInitialized` performs a profile lookup. If the profile record is missing (onboarding not completed), it throws `Profile not found for user: ...` and returns an error response.
   - `/api/match-groups`: Generates fallback candidates. It will query groups, but fails to calculate personal compatibility due to missing travel intentions.
   - Profile updating `/api/profile/update` must remain accessible to un-onboarded users as they write their profile details during the onboarding flow.
3. **Impact**: Bypassing client-side routing allows un-onboarded users to call select endpoints, but does not result in privilege escalation or data leakage. It remains a UX state issue rather than a security exploit.

### Verdict
**CONFIRMED** (UX State Bypass)
- **Severity**: Medium (QA / Functional Parity issue).
- **Affected Endpoints**: `/api/match-groups`, group membership join/leave actions.
- **Recommended Remediation**: Introduce a server-side check in `resolveUser` or target endpoints validating the user profile's onboarding status before matching/group interactions are processed.

---

## CROSS-FINDING ANALYSIS

| Finding | Audit Claim | Actual Behavior | Production Impact | Severity | Verdict | Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Edge JWT Bypass** | Signature verification bypassed in Edge runtime. | Fallback decodes token without verification in Next.js Edge middleware. | Bypasses middleware blacklist ban check; blocked later at API Node layer. | High | **CONFIRMED** | **RELEASE BLOCKER** (Refactor signature check to use `jose` before public launch). |
| **2. Banned User Session** | Banned users can call APIs using active access tokens. | Access tokens are verified in real-time against DB ban states in API routes. | Banned users are blocked instantly across both API and Socket connections. | Low | **FALSE POSITIVE** | None required. |
| **3. Client Onboarding** | Onboarding is only client-enforced. | Onboarding status is not validated server-side, enabling API access. | Un-onboarded users can retrieve group candidates but crash on solo matching. | Medium | **CONFIRMED** | **QA BLOCKER** (Enforce profile check in API gates). |

---

## Recommendation

**Can production E2E QA safely begin? YES**

**Justification & Execution Starting Point**:
- Production E2E QA can safely begin immediately on staging/production environments. 
- While Finding 1 is a **Release Blocker** for public launch, it is mitigated because the API routes run in Serverless Node.js and enforce signature validation before serving data. The system is secure against data leakage exploits during testing.
- **QA Execution Starting Point**: Begin manual QA with **Authentication and OTP registration flows**, followed by **Profile creation/Onboarding** and **Real-time Chat connectivity**.
