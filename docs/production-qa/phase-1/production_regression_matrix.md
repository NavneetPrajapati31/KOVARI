# KOVARI — Production Regression Matrix (Phase 1)

This matrix defines the master regression cases for manual validation on the production environments.

| Module | Scenario | Web Entry | Mobile Entry | Backend Endpoint | Expected Result | Test Data | Evidence Required | Risk |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth** | Email Sign Up | `/sign-up` page | `RegisterScreen` | `/api/auth/register` | User is registered, receives OTP verify code. | New unique email | Verification screen shown, User created in DB | **P0** |
| **Auth** | OTP Verification | `/verify-email` page | `OtpVerificationScreen` | `/api/auth/verify-otp` | Correct code logs user in, returns access/refresh tokens. | Valid OTP from DB/mail | Session initialized, redirected to Onboarding | **P0** |
| **Auth** | Resend OTP | `/verify-email` (Resend) | `OtpVerificationScreen` (Resend) | `/api/auth/resend-otp` | Trigger new email OTP. | Registered unverified email | Success toast, new OTP code received | **P1** |
| **Auth** | Email Login | `/sign-in` page | `LoginScreen` | `/api/auth/login` | Returns tokens and user object, establishes session. | Valid email/pass | Navigation to home screen | **P0** |
| **Auth** | Google Login | `/sign-in` (Google button) | `LoginScreen` (Google button) | `/api/auth/google` | authenticates with Google token, signs user in. | Google OAuth credentials | Logged in home state | **P0** |
| **Auth** | Silent Session Restore | Automatic on reload | `ensureSessionReady` on boot | `/api/auth/me` | Re-establishes session without login screen prompt. | Existing valid tokens | App opens past splash directly to Home | **P0** |
| **Auth** | Token Refresh & Rotation | Automatic on Clerk middleware | `refreshToken` in AuthRepository | `/api/auth/refresh` | Rotates refresh token, issues fresh 15m access token. | Active session | HTTP network capture logs showing `200` response | **P0** |
| **Auth** | Logout | Profile settings logout | Profile settings logout | `/api/auth/logout` | Revokes refresh token, cleans secure storage, resets router. | Authenticated state | Clear storage, redirect to Login screen | **P0** |
| **Profile**| Get Profile | `/profile` page | `ProfileScreen` | `/api/profile/current` | Loads current user profile and attributes. | Onboarded user | Bio, avatar, travel intentions load | **P1** |
| **Profile**| Edit Profile | `/profile/edit` page | `EditProfileScreen` | `/api/profile/update` | Updates user details, coordinates, travel preferences. | Form fields, valid coordinates | Database updates verified in public profile | **P1** |
| **Explore**| Solo Matching | `/explore` feed | `ExploreScreen` | `/api/match-solo` | Recommends matching cards based on preferences and Go logic. | Geographic coordinates, age range | Stack of cards with matching personality/destinations | **P1** |
| **Explore**| Match Connect | Swipe Right / "Connect" | Swipe Right / "Connect" | `/api/matching/interest` | Records interest. If mutual, initiates chat room. | Overlapping preferences | Match screen overlay, new room in Inbox | **P0** |
| **Explore**| Match Skip | Swipe Left / "Skip" | Swipe Left / "Skip" | `/api/matching/skip` | Suppresses profile from showing up in matching feed again. | Feed cards | Card is skipped, never shown in current session | **P2** |
| **Groups** | Create Group | `/groups/new` page | `CreateGroupScreen` | `/api/mobile/groups/create` (Mobile) / `/api/create-group` (Web) | Creates new travel group and sets creator as admin. | Title, description, cover image | Redirect to group dashboard | **P1** |
| **Groups** | live Itinerary Sync | Group Itinerary tab | Group Itinerary tab | `/api/groups/[groupId]/itinerary` | Realtime CRUD operations synchronize across Web and Mobile. | Location, date, notes | Itinerary additions populate in real-time | **P1** |
| **Chat** | Realtime Messaging | Chat Room | Chat Room | Supabase Realtime / WebSockets | Direct message sent by User A is instantly received by User B. | Encrypted messages | Socket payload showing decrypted content | **P0** |
| **Chat** | Typing Indicator | Chat active | Chat active | WebSocket `/typing` | Displays active typing indicator when other user is typing. | Typing event triggers | Visual "typing..." indicator appears | **P2** |
| **Chat** | Block Enforcement | Chat Room | Chat Room | Database / Socket Server | Prevents sending messages to users who have blocked you. | Blocked status active | "Failed to send" or block message notice | **P0** |
| **Notifications** | Push registration | Background app boot | Foreground app boot | `/api/devices/register` | Registers FCM token with device ID for push notifications. | FCM Token | DB entry in `devices` table | **P1** |
| **Safety** | Report Target | Flag icon on user | Flag icon on user | `/api/matching/report` | Persists user report in database for moderator review. | Report reasons | Success dialog, report row in db | **P1** |
| **Safety** | Block User | Profile block option | Profile block option | `/api/users/block` | Prevents blocked user from appearing in Explore or messaging. | User IDs | Instant exclusion from feeds | **P0** |
| **Testing**| Tester Isolation | Visual badge check | Visual badge check | `/api/flags/test` | Users with `is_internal` flag are isolated to internal feeds. | Test accounts | Non-internal users cannot see internal profiles | **P1** |
| **Settings**| Delete Account | Settings delete page | Settings delete page | `/api/settings/delete-account` | Soft-deletes user, revokes Clerk session, cleans local cache. | Target user account | Login redirection, DB flag `isDeleted = true` | **P0** |
