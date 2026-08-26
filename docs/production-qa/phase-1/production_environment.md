# KOVARI — Production Environment & Dependencies

This document maps all environment-specific configurations and third-party dependencies that differentiate the development and production environments.

---

## 1. Environment Configurations

| Dependency / Config | Dev Value (Local) | Production Value | Failure Impact | Verification Method |
| :--- | :--- | :--- | :--- | :--- |
| **API Base URL** | `http://192.168.1.92:3000/api/` | `https://app.kovari.in/api/` | E2E breakdown (App offline) | `GET /api/health` returns status `200` |
| **Web Base URL** | `http://192.168.1.92:3000` | `https://app.kovari.in` | Deep links, OAuth redirects break | Verify path redirects from web portal |
| **Socket URL** | `http://192.168.1.92:3005` | `https://socket.kovari.in` | Realtime chat and typing fail | Watch Socket.io connection handshake log |
| **Supabase URL** | Local instance / Test URL | `https://belgecmnlvypuhqjztho.supabase.co` | Database operations fail | Check connectivity on database clients |
| **Firebase Project** | `kovari-8a50a` (Web) | `kovari-19a83` (Admin API) | Push notifications fail | Register device token, trigger mock test push |
| **Clerk Auth Instance**| Development instance | Production instance | Sign Up, Sign In, Web Auth fail | Perform E2E signup/login on live client |
| **Geoapify API Key** | `ad0301573e0c4745a86ceecf814f2e65` | Same (or restricted prod key) | Geocoding and destination search fails | Query coordinates on onboarding flow |
| **Sentry DSN** | None / Dev Project | Pinned Project DSN | Error tracing fails | Trigger simulated crash in dev build |
| **Cloudinary Preset** | `kovari_unsigned` | `kovari_unsigned` (restricted) | Media upload fails | Upload a test avatar, verify Cloudinary URL |

---

## 2. Server Environment Credentials (Next.js & Supabase)
The backend requires environment variables configured in production hosting environments (Vercel/Render):
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`: Used to generate and verify Custom JWTs on mobile. Must match between matching-service and Next.js backend.
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key allowing database read/write overrides (RLS bypass for administrative sync operations).
- `CLERK_SECRET_KEY`: Used by Clerk SDK to authorize web requests.
- `RESEND_API_KEY`: Used for sending email verification OTPs and waitlist campaigns.

---

## 3. Configuration Verification Checklist
Before executing manual E2E regression tests, verify the following:
1. **CORS Configuration**: Ensure Socket server (`socket.kovari.in`) explicitly lists `app.kovari.in` and web client origins.
2. **Apple & Google App Store Links**: Verify deep-linking domains (`app.kovari.in/invite/*` and `app.kovari.in/verify-email/*`) are configured in Flutter's `AndroidManifest.xml` and `Runner.entitlements`.
3. **Database RLS Policies**: Ensure `sync_user_identity` RPC execution rights are active for anon users.
