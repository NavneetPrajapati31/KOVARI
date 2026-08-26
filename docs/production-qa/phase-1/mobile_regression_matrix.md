# KOVARI — Mobile Regression Matrix (Phase 1)

This matrix tracks the human-executed manual QA scenarios on the production Android APK. No automated testing or static code assumptions can change any status from `UNVERIFIED`.

| Module | Scenario ID | Scenario | Expected Behavior | Actual Behavior | Status | Severity | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth** | **A1** | Email Login | Valid login navigates to home; invalid password/email displays clear error. | Valid login works. Invalid credentials/email inputs trigger generic "Exception: email login failed" snackbar and lack local email format validation. | **FAIL** | P3 | Owner report |
| **Auth** | **A2** | Google Login | Triggers Google Account chooser, authenticates, and redirects correctly. | Google Account Chooser appears, logs in successfully, and redirects to Home/Onboarding with no duplicates. | **PASS** | - | Owner report |
| **Auth** | **A3** | Signup | Enforces required fields, executes verification OTP, transitions to Onboarding. | Enforces inputs, submits registration, and transitions to the OTP verification screen successfully. | **PASS** | - | Owner report |
| **Auth** | **A4** | Logout | Cleans tokens/state, disconnects sockets, resets navigation router to Login. | Navigates cleanly to Login, clears session, no back-stack escape into the app. | **PASS** | - | Owner report |
| **Auth** | **A5** | Session Restore | Killing and relaunching the app restores authenticated session instantly. | App relaunches directly into authenticated Home/Dashboard without requiring re-login. | **PASS** | - | Owner report |
| **Auth** | **A6** | Token Refresh | Silent rotation succeeds when token expires without logging user out. | | **UNVERIFIED** | - | - |
| **Auth** | **A7** | Forgot Password | Requests reset link, completes flow, logs in successfully with new password. | Request email sends (PASS). Reset link in email invalid/not opening in app — cannot set new password. Login with new password untestable. | **FAIL** | P1 | Owner report |
| **Auth** | **A8** | Password Reset | Complete password reset lifecycle verification. | Blocked by A7 failure — reset link broken, cannot reach reset-password screen. | **BLOCKED** | P1 | Depends on BUG-A7 |
| **Auth** | **A9** | Email Verification | Enforces OTP rules, invalid code alerts, resend functionality checks. | Incorrect OTP shows generic "Exception: OTP verification failed". Resend and correct OTP both work. | **FAIL** | P3 | Owner report |
| **Auth** | **A10** | Delete Account | Disposable account soft-deleted, state purged, cannot restore session. | Confirmation prompt appears. Deletes and redirects to Login. Re-login with deleted credentials succeeds and redirects to Onboarding instead of returning an error. | **FAIL** | P2 | Owner report |
| **Auth** | **A11** | Ban Enforcement | Live session receives ban status, invalidates token, shows Banned screen. | Login blocked with Banned screen. Live ban applied during active session detected in real-time, socket disconnected, redirected to Banned screen. | **PASS** | - | Owner report |
| **Auth** | **A12** | Tester Login | Internal account displays "Test Mode" visual indicator and isolates telemetry. | Test Mode badge visible on Profile screen (PASS). Telemetry suppression not verified (requires logcat/Firebase access — skipped). | **PASS** | - | Owner report |
| **Profile** | **P1** | View Profile | Profile screen displays accurate, complete user details. | All profile fields display correctly (name, bio, photos, travel intentions, gender, age). | **PASS** | - | Owner report |
| **Profile** | **P2** | Edit Profile | User can modify fields (bio, travel intentions, budget) and save changes. | Fields editable and saved successfully. Changes persist after app relaunch. | **PASS** | - | Owner report |
| **Profile** | **P3** | Avatar Upload | Uploading an avatar crops image, saves via Cloudinary, updates UI immediately. | Crop tool works, upload completes, avatar updates immediately and persists after relaunch. | **PASS** | - | Owner report |
| **Profile** | **P4** | Profile Persistence| Changes persist after app force-close and relaunch. | Profile changes (bio, travel intentions) confirmed persisting after force-kill and relaunch. | **PASS** | - | Owner report |
| **Profile** | **P5** | Travel Intentions| User can set/update destination preferences, coordinates, and dates. | Travel intentions updated, saved successfully, and persist after relaunch. | **PASS** | - | Owner report |
| **Profile** | **P6** | Preferences | User preference updates persist after app reload/restart. | N/A — preferences (food, smoking, drinking, personality) are backend profile fields with no separate local preference store. Covered by P2 (Edit Profile). | **N/A** | - | Codebase audit |
| **Profile** | **P7** | Tester Badge | Verify "Test Mode" badge appears only for approved internal test accounts. | Test Mode badge confirmed visible on internal tester profile screen. | **PASS** | - | Owner report |
| **Profile** | **P8** | Public Profile | Opening another QA user's profile displays correct metadata and action buttons. | Public profile opens correctly with name, photo, bio, travel intentions, and correct action buttons. | **PASS** | - | Owner report |
| **Profile** | **P9** | Coordinates | Coordinates for destination remain accurate after saving, refreshing, and restarting. | Coordinates remain accurate after save and relaunch with no drift or reset. | **PASS** | - | Owner report |
| **Profile** | **P10**| Profile Refresh | Pull-to-refresh fetches latest profile edits from the backend database. | Pull-to-refresh updates profile correctly with latest backend data. | **PASS** | - | Owner report |
| **Explore** | **E1** | Solo Feed Load | Swiping cards load correctly based on coordinates and filters. | Solo feed cards load correctly, coordinates and filters applied, no crashes. | **PASS** | - | Owner report |
| **Explore** | **E2** | Solo Connect | Swiping right / connecting records interest. Mutual connects spawn chat rooms. | Interest recorded, card dismissed, mutual match spawned chat room, appears in Inbox. | **PASS** | - | Owner report |
| **Explore** | **E3** | Solo Skip | Swiping left skips card. Excludes skipped card from subsequent loads. | Cards dismiss immediately and are excluded from subsequent loads. | **PASS** | - | Owner report |
| **Explore** | **E4** | Seen-User Guard | Seen users do not repeatedly reappear in matching queue. | Interacted users (likes/skips) are successfully excluded from the queue even after app restarts. | **PASS** | - | Owner report |
| **Explore** | **E5** | Group Feed | Group cards load, can browse and express interest. Details rendered correctly. | Group cards not rendering correctly or completely. Results not showing instantly. Fields missing or incorrect on GroupMatchCard. | **FAIL** | P2 | Owner report |
| **Groups** | **G1** | Group Lifecycle | Create, edit, and delete groups. Verify state changes in UI. | | **UNVERIFIED** | - | - |
| **Groups** | **G2** | Membership | Request to join, leave, pending approval workflow validations. | | **UNVERIFIED** | - | - |
| **Groups** | **G3** | Itinerary Sync | Real-time additions, updates, and deletes to group itinerary sync to other users. | | **UNVERIFIED** | - | - |
| **Chat** | **C1** | Realtime Send/Recv| Direct messages route instantly between Web/Mobile clients. | | **UNVERIFIED** | - | - |
| **Chat** | **C2** | Receipts | Delivery and Read receipts update correctly for sender. | | **UNVERIFIED** | - | - |
| **Chat** | **C3** | Presence/Typing | Typing indicator and active presence states toggle dynamically. | | **UNVERIFIED** | - | - |
| **Chat** | **C4** | Offline Recovery | Toggling network connections from Wi-Fi to mobile data restores messages. | | **UNVERIFIED** | - | - |
| **Notifications**| **N1** | Push Delivery | FCM push alerts show on background / cold start / foreground. | | **UNVERIFIED** | - | - |
| **Notifications**| **N2** | Deep Linking | Tapping push opens targeted chat conversation directly. | | **UNVERIFIED** | - | - |
| **Safety** | **S1** | Report/Block | Reporting or blocking a user blocks chat and excludes them from Explore feed. | | **UNVERIFIED** | - | - |
| **Regression** | **R1** | FCM Register | Push token successfully registers at `/devices/register` endpoint. | | **UNVERIFIED** | - | - |
| **Regression** | **R2** | CORS Connection | Real-time sockets connect cleanly without CORS blocks. | | **UNVERIFIED** | - | - |
| **Regression** | **R3** | Inbox Snippet | Live conversation shows last message snippet, not default placeholder. | | **UNVERIFIED** | - | - |
| **Regression** | **R4** | Live Sync Refresh| Live invitations and interests show dynamically without manual refreshing. | | **UNVERIFIED** | - | - |
