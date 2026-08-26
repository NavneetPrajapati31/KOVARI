# KOVARI — Security Hotfixes & Onboarding Enforcement Tasks

These separate engineering tasks have been created to address confirmed security and state bypass findings discovered during the codebase audit. They must be resolved as separate development tasks and not mixed into the current manual QA execution baseline.

---

## TASK 1: KOVARI — P0 Security Hotfix: Edge JWT Signature Verification

### Objective
Remove the unsigned JWT fallback from the Next.js Edge middleware authentication path.

### Scope
Modify only the JWT verification implementation required to make:
```text
Mobile JWT ➔ Edge Middleware ➔ Cryptographic signature verification ➔ issuer/type/sub validation ➔ ban validation
```
use the same cryptographically verified JWT contract as Node API routes.

### Requirements
- **Dependency**: Use the already-installed `jose` dependency.
- **Support**: Support both access and refresh tokens.
- **Validations**:
  - Preserve existing issuer validation.
  - Preserve token type validation.
  - Preserve UUID validation.
  - Preserve existing expiration semantics.
- **Compatibility**:
  - Preserve mobile JWT compatibility.
  - Preserve existing Node API behavior.
  - Preserve Socket authentication.
- **Lockdown**: Remove any fallback that trusts decoded JWT payload without signature verification.
- **Non-destructive**: Do not modify JWT claims, token format, or backend business logic.

### Verification Plan
1. Valid signed access token ➔ Accepted.
2. Valid signed refresh token ➔ Accepted.
3. Expired token ➔ Rejected.
4. Wrong signature ➔ Rejected.
5. Missing signature ➔ Rejected.
6. Modified `sub` ➔ Rejected.
7. Modified `iss` ➔ Rejected.
8. Modified `type` ➔ Rejected.
9. Modified expiration ➔ Rejected.
10. Existing mobile login ➔ Still works.
11. Existing token refresh ➔ Still works.
12. Production API authentication ➔ Unaffected.
13. Socket authentication ➔ Unaffected.

### Exit Criterion
There must be **no code path anywhere in Edge authentication that trusts a JWT payload without cryptographic verification.**

---

## TASK 2: KOVARI — P1 Backend Authorization: Onboarding Validation Gate

### Objective
Enforce profile onboarding status check server-side for endpoints that require fully completed profiles.

### Scope
Enforce profile verification logic selectively on protected endpoints. Do not block onboarding endpoints.
```text
Authenticated
      ↓
Is onboarding required for this endpoint?
      ↓
YES ──→ onboarding_completed?
           │
           ├── YES → continue
           └── NO  → reject / onboarding-required
           
NO ───────→ continue
```

### Requirements
- **Endpoints to restrict**:
  - `/api/match-solo` (fails naturally, but should have explicit check).
  - `/api/match-groups` (currently bypasses).
  - Group join and membership actions.
- **Endpoints to allow**:
  - `/api/profile/update` (must remain accessible before onboarding because onboarding itself uses that endpoint).
- **Enforcement**: Reject with a clear error payload if onboarding is required but not completed.
