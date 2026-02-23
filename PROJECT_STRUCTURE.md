# Project Structure

```text
KOVARI
├── .cursor
│   ├── rules
│   │   └── rules.mdc
│   └── debug.log
├── .github
│   ├── workflows
│   │   └── admin-ci.yml
│   ├── CODEOWNERS
│   └── PULL_REQUEST_TEMPLATE.md
├── apps
│   └── admin
│       ├── .vercel
│       │   ├── project.json
│       │   └── README.txt
│       ├── app
│       │   ├── (auth)
│       │   │   └── sign-in
│       │   │       └── [[...sign-in]]
│       │   │           └── page.tsx
│       │   ├── api
│       │   │   ├── admin
│       │   │   │   ├── audit
│       │   │   │   │   └── route.ts
│       │   │   │   ├── auth
│       │   │   │   │   ├── log
│       │   │   │   │   └── login
│       │   │   │   ├── errors
│       │   │   │   │   └── summary
│       │   │   │   ├── flags
│       │   │   │   │   ├── [id]
│       │   │   │   │   └── route.ts
│       │   │   │   ├── groups
│       │   │   │   │   ├── [id]
│       │   │   │   │   └── route.ts
│       │   │   │   ├── metrics
│       │   │   │   │   └── route.ts
│       │   │   │   ├── sessions
│       │   │   │   │   ├── [key]
│       │   │   │   │   ├── debug
│       │   │   │   │   ├── expire
│       │   │   │   │   ├── search
│       │   │   │   │   ├── test
│       │   │   │   │   └── route.ts
│       │   │   │   ├── settings
│       │   │   │   │   └── route.ts
│       │   │   │   └── users
│       │   │   │       ├── [id]
│       │   │   │       └── route.ts
│       │   │   └── sentry-example-api
│       │   │       └── route.ts
│       │   ├── audit
│       │   │   └── page.tsx
│       │   ├── flags
│       │   │   └── page.tsx
│       │   ├── groups
│       │   │   ├── [id]
│       │   │   │   └── page.tsx
│       │   │   └── page.tsx
│       │   ├── not-authorized
│       │   │   └── page.tsx
│       │   ├── sentry-example-page
│       │   │   └── page.tsx
│       │   ├── sessions
│       │   │   └── page.tsx
│       │   ├── settings
│       │   │   └── page.tsx
│       │   ├── users
│       │   │   ├── [id]
│       │   │   │   └── page.tsx
│       │   │   └── page.tsx
│       │   ├── favicon.ico
│       │   ├── global-error.tsx
│       │   ├── globals.css
│       │   ├── layout.tsx
│       │   └── page.tsx
│       ├── components
│       │   ├── ui
│       │   │   ├── avatar.tsx
│       │   │   ├── badge.tsx
│       │   │   ├── button.tsx
│       │   │   ├── calendar.tsx
│       │   │   ├── card.tsx
│       │   │   ├── checkbox.tsx
│       │   │   ├── command.tsx
│       │   │   ├── dialog.tsx
│       │   │   ├── dropdown-menu.tsx
│       │   │   ├── input.tsx
│       │   │   ├── label.tsx
│       │   │   ├── popover.tsx
│       │   │   ├── select.tsx
│       │   │   ├── separator.tsx
│       │   │   ├── sheet.tsx
│       │   │   ├── sidebar.tsx
│       │   │   ├── skeleton.tsx
│       │   │   ├── switch.tsx
│       │   │   ├── table.tsx
│       │   │   ├── textarea.tsx
│       │   │   └── tooltip.tsx
│       │   ├── AdminFlagsTable.tsx
│       │   ├── AdminGroupsTable.tsx
│       │   ├── AdminLayoutWrapper.tsx
│       │   ├── AdminSearch.tsx
│       │   ├── AdminSidebar.tsx
│       │   ├── AdminTopbar.tsx
│       │   ├── AdminUsersTable.tsx
│       │   ├── auth-form.tsx
│       │   ├── ConfirmDialog.tsx
│       │   ├── DashboardAutoRefresh.tsx
│       │   ├── FlagDetailModal.tsx
│       │   ├── GroupDetail.tsx
│       │   ├── SessionRow.tsx
│       │   ├── Toast.tsx
│       │   └── UserDetail.tsx
│       ├── hooks
│       │   └── use-mobile.ts
│       ├── lib
│       │   ├── email-templates
│       │   │   ├── admin-actions.ts
│       │   │   └── layout.ts
│       │   ├── adminAuth.ts
│       │   ├── AdminSessionApi.ts
│       │   ├── cloudinary.ts
│       │   ├── cloudinaryEvidence.ts
│       │   ├── groupSafetyHandler.ts
│       │   ├── incrementErrorCounter.ts
│       │   ├── logAdminAction.ts
│       │   ├── redisAdmin.ts
│       │   ├── revokeExpiredSuspensions.ts
│       │   ├── send-email.ts
│       │   ├── settings.ts
│       │   ├── supabaseAdmin.ts
│       │   ├── test-cloudinaryEvidence.ts
│       │   ├── toCsv.ts
│       │   └── utils.ts
│       ├── public
│       │   ├── file.svg
│       │   ├── globe.svg
│       │   ├── next.svg
│       │   ├── vercel.svg
│       │   └── window.svg
│       ├── tests
│       │   ├── api
│       │   ├── mocks
│       │   │   ├── server-only
│       │   │   │   └── index.js
│       │   │   ├── handlers.ts
│       │   │   └── server-only.js
│       │   ├── adminActions.test.ts
│       │   ├── adminAuth.test.ts
│       │   ├── integration_sessions.js
│       │   ├── setup.ts
│       │   ├── unit-redisAdmin-parseSessionValue.js
│       │   └── unit-requireAdmin.js
│       ├── types
│       ├── .env.local
│       ├── .env.sentry-build-plugin
│       ├── .eslintrc.json
│       ├── .gitignore
│       ├── .prettierrc
│       ├── components.json
│       ├── instrumentation-client.ts
│       ├── instrumentation.ts
│       ├── middleware.ts
│       ├── next-env.d.ts
│       ├── next.config.ts
│       ├── package-lock.json
│       ├── package.json
│       ├── postcss.config.mjs
│       ├── README.md
│       ├── sentry.edge.config.ts
│       ├── sentry.server.config.ts
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       ├── tsconfig.tsbuildinfo
│       ├── vercel.json
│       └── vitest.config.ts
├── public
│   ├── fonts
│   │   ├── matgefo
│   │   │   └── matgefo.otf
│   │   ├── new-title
│   │   │   ├── NewTitle-Bold.eot
│   │   │   ├── NewTitle-Bold.ttf
│   │   │   ├── NewTitle-Bold.woff
│   │   │   ├── NewTitle-Bold.woff2
│   │   │   ├── NewTitle-Extralight.eot
│   │   │   ├── NewTitle-Extralight.ttf
│   │   │   ├── NewTitle-Extralight.woff
│   │   │   ├── NewTitle-Extralight.woff2
│   │   │   ├── NewTitle-Light.eot
│   │   │   ├── NewTitle-Light.ttf
│   │   │   ├── NewTitle-Light.woff
│   │   │   ├── NewTitle-Light.woff2
│   │   │   ├── NewTitle-Medium.eot
│   │   │   ├── NewTitle-Medium.ttf
│   │   │   ├── NewTitle-Medium.woff
│   │   │   ├── NewTitle-Medium.woff2
│   │   │   ├── NewTitle-Regular.eot
│   │   │   ├── NewTitle-Regular.ttf
│   │   │   ├── NewTitle-Regular.woff
│   │   │   ├── NewTitle-Regular.woff2
│   │   │   ├── NewTitle-Variable.eot
│   │   │   ├── NewTitle-Variable.ttf
│   │   │   ├── NewTitle-Variable.woff
│   │   │   └── NewTitle-Variable.woff2
│   │   └── roundhand
│   │       ├── Roundhand Bold.woff
│   │       └── Roundhand Regular.woff
│   └── google54b5f6252311fa10.html
├── scripts
│   └── backfill-group-destination-coords.ts
├── src
│   ├── app
│   │   ├── (app)
│   │   │   ├── chat
│   │   │   │   ├── [userId]
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── chat-client-layout.tsx
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── create-group
│   │   │   │   └── page.tsx
│   │   │   ├── dashboard
│   │   │   │   └── page.tsx
│   │   │   ├── explore
│   │   │   │   └── page.tsx
│   │   │   ├── groups
│   │   │   │   ├── [groupId]
│   │   │   │   │   ├── chat
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── home
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── itinerary
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── settings
│   │   │   │   │   │   ├── danger
│   │   │   │   │   │   ├── edit
│   │   │   │   │   │   ├── members
│   │   │   │   │   │   ├── requests
│   │   │   │   │   │   ├── layout.tsx
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── invite
│   │   │   │   └── [token]
│   │   │   │       ├── accept-invite-client.tsx
│   │   │   │       └── page.tsx
│   │   │   ├── notifications
│   │   │   │   └── page.tsx
│   │   │   ├── onboarding
│   │   │   │   └── page.tsx
│   │   │   ├── profile
│   │   │   │   ├── [userId]
│   │   │   │   │   ├── connections
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── loading.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── edit
│   │   │   │   │   ├── general
│   │   │   │   │   │   └── section.tsx
│   │   │   │   │   ├── personal
│   │   │   │   │   │   └── section.tsx
│   │   │   │   │   ├── professional
│   │   │   │   │   │   └── section.tsx
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── requests
│   │   │   │   └── page.tsx
│   │   │   ├── safety
│   │   │   │   └── page.tsx
│   │   │   ├── settings
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (auth)
│   │   │   ├── forgot-password
│   │   │   │   └── page.tsx
│   │   │   ├── sign-in
│   │   │   │   └── [[...sign-in]]
│   │   │   │       └── page.tsx
│   │   │   ├── sign-up
│   │   │   │   └── [[...sign-up]]
│   │   │   │       └── page.tsx
│   │   │   ├── sso-callback
│   │   │   │   └── page.tsx
│   │   │   └── verify-email
│   │   │       └── page.tsx
│   │   ├── (marketing)
│   │   │   ├── about
│   │   │   │   └── page.tsx
│   │   │   ├── landing
│   │   │   │   └── page.tsx
│   │   │   ├── privacy
│   │   │   │   └── page.tsx
│   │   │   ├── terms
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── api
│   │   │   ├── auth
│   │   │   │   ├── forgot-password
│   │   │   │   │   └── route.ts
│   │   │   │   ├── otp
│   │   │   │   ├── reset-password
│   │   │   │   │   └── route.ts
│   │   │   │   ├── send-verification
│   │   │   │   ├── unlink-social-accounts
│   │   │   │   ├── verify-email
│   │   │   │   └── verify-otp
│   │   │   ├── check-username
│   │   │   │   └── route.ts
│   │   │   ├── create-group
│   │   │   │   └── route.ts
│   │   │   ├── cron
│   │   │   │   └── send-waitlist-emails
│   │   │   │       └── route.ts
│   │   │   ├── direct-chat
│   │   │   │   ├── inbox
│   │   │   │   │   └── route.ts
│   │   │   │   ├── media
│   │   │   │   │   └── route.ts
│   │   │   │   ├── messages
│   │   │   │   │   └── route.ts
│   │   │   │   └── profiles
│   │   │   │       └── route.ts
│   │   │   ├── DoneTrips
│   │   │   │   └── route.ts
│   │   │   ├── event
│   │   │   │   └── route.ts
│   │   │   ├── events
│   │   │   │   └── group-events
│   │   │   │       └── route.ts
│   │   │   ├── flags
│   │   │   │   ├── evidence
│   │   │   │   │   └── route.ts
│   │   │   │   ├── test
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── follow
│   │   │   │   └── [userId]
│   │   │   │       └── route.ts
│   │   │   ├── group-invitation
│   │   │   │   ├── accept
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── groups
│   │   │   │   ├── [groupId]
│   │   │   │   │   ├── ai-overview
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── delete
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── encryption-key
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── itinerary
│   │   │   │   │   │   ├── [itemId]
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── join
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── join-request
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── leave
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── media
│   │   │   │   │   │   ├── [mediaId]
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── members
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── membership
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── messages
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── interest
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── interests
│   │   │   │   ├── respond
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── Itinerary
│   │   │   │   └── route.ts
│   │   │   ├── match-groups
│   │   │   │   └── route.ts
│   │   │   ├── match-solo
│   │   │   │   └── route.ts
│   │   │   ├── matching
│   │   │   │   ├── interest
│   │   │   │   │   └── route.ts
│   │   │   │   ├── report
│   │   │   │   │   └── route.ts
│   │   │   │   └── skip
│   │   │   │       └── route.ts
│   │   │   ├── notifications
│   │   │   │   ├── [id]
│   │   │   │   │   └── route.ts
│   │   │   │   ├── mark-all-read
│   │   │   │   │   └── route.ts
│   │   │   │   ├── unread-count
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── pending-invitations
│   │   │   │   └── route.ts
│   │   │   ├── profile
│   │   │   │   ├── [userId]
│   │   │   │   │   ├── followers
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── following
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── current
│   │   │   │   │   └── route.ts
│   │   │   │   ├── update
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── profile-impressions
│   │   │   │   └── route.ts
│   │   │   ├── redis
│   │   │   │   ├── session
│   │   │   │   │   └── route.ts
│   │   │   │   ├── test
│   │   │   │   │   └── route.ts
│   │   │   │   └── session.ts
│   │   │   ├── sentry-example-api
│   │   │   │   └── route.ts
│   │   │   ├── session
│   │   │   │   └── route.ts
│   │   │   ├── settings
│   │   │   │   ├── change-email
│   │   │   │   │   └── route.ts
│   │   │   │   ├── change-password
│   │   │   │   │   └── route.ts
│   │   │   │   ├── delete-account
│   │   │   │   │   └── route.ts
│   │   │   │   └── remove-email-addresses
│   │   │   │       └── route.ts
│   │   │   ├── supabase
│   │   │   │   └── sync-user
│   │   │   │       └── route.ts
│   │   │   ├── test-db
│   │   │   │   └── route.ts
│   │   │   ├── test-geocoding
│   │   │   │   └── route.ts
│   │   │   ├── test-groups
│   │   │   │   └── route.ts
│   │   │   ├── test-redis
│   │   │   │   └── route.ts
│   │   │   ├── travel-days
│   │   │   │   └── route.ts
│   │   │   ├── travel-mode
│   │   │   │   └── route.ts
│   │   │   ├── travel-preferences
│   │   │   │   └── route.ts
│   │   │   ├── upload-image-from-url
│   │   │   │   └── route.ts
│   │   │   ├── uploads
│   │   │   │   └── groups
│   │   │   │       └── [groupId]
│   │   │   │           └── [filename]
│   │   │   ├── uploadthing
│   │   │   │   ├── core.ts
│   │   │   │   └── route.ts
│   │   │   ├── user-posts
│   │   │   │   └── route.ts
│   │   │   ├── users
│   │   │   │   ├── block
│   │   │   │   │   └── route.ts
│   │   │   │   ├── check
│   │   │   │   └── create
│   │   │   ├── waitlist
│   │   │   │   └── route.ts
│   │   │   └── webhooks
│   │   │       └── clerk
│   │   ├── banned
│   │   │   └── page.tsx
│   │   ├── dev-tools
│   │   │   ├── test-destination-cards
│   │   │   │   └── page.tsx
│   │   │   ├── test-google-fetch
│   │   │   │   └── page.tsx
│   │   │   ├── test-group-card
│   │   │   │   └── page.tsx
│   │   │   ├── test-group-form
│   │   │   │   └── page.tsx
│   │   │   ├── test-invite-flow
│   │   │   │   └── page.tsx
│   │   │   ├── test-mode-selection
│   │   │   │   └── page.tsx
│   │   │   ├── test-pexels-fetch
│   │   │   │   └── page.tsx
│   │   │   ├── test-travel-form
│   │   │   │   └── page.tsx
│   │   │   └── test-user-card
│   │   │       └── page.tsx
│   │   ├── sentry-example-page
│   │   │   └── page.tsx
│   │   ├── global-error.tsx
│   │   ├── layout.tsx
│   │   ├── manifest.ts
│   │   ├── opengraph-image.tsx
│   │   ├── page.tsx
│   │   ├── robots.ts
│   │   ├── sitemap.ts
│   │   └── twitter-image.tsx
│   ├── components
│   │   └── forms
│   │       └── form.tsx
│   ├── features
│   │   ├── auth
│   │   │   └── components
│   │   │       ├── auth-form.tsx
│   │   │       └── hero-section.tsx
│   │   ├── dashboard
│   │   │   ├── ConnectionRequestsCard.tsx
│   │   │   ├── GalleryCard.tsx
│   │   │   ├── GroupCard.tsx
│   │   │   ├── heatmap.tsx
│   │   │   ├── ImpressionsChart.tsx
│   │   │   ├── InviteCard.tsx
│   │   │   ├── TopDestinationCard.tsx
│   │   │   ├── TravelDaysCard.tsx
│   │   │   ├── UpcomingTripCard.tsx
│   │   │   └── UserConnect.tsx
│   │   ├── explore
│   │   │   ├── components
│   │   │   │   ├── ExploreFilter.tsx
│   │   │   │   ├── ExploreFilters.tsx
│   │   │   │   ├── ExploreSidebar.tsx
│   │   │   │   ├── FiltersPanel.tsx
│   │   │   │   ├── GroupCard.tsx
│   │   │   │   ├── GroupCardSkeleton.tsx
│   │   │   │   ├── GroupMatchCard.tsx
│   │   │   │   ├── NoResultsPlaceholder.tsx
│   │   │   │   ├── ResultsDisplay.tsx
│   │   │   │   ├── SearchForm.tsx
│   │   │   │   ├── SoloMatchCard.tsx
│   │   │   │   └── TabSelector.tsx
│   │   │   ├── lib
│   │   │   │   ├── fetchExploreData.ts
│   │   │   │   └── matchingActions.ts
│   │   │   └── types
│   │   │       ├── filters-state.ts
│   │   │       └── index.ts
│   │   ├── groups
│   │   │   ├── components
│   │   │   │   ├── edit-group-sections
│   │   │   │   │   ├── advanced-section.tsx
│   │   │   │   │   ├── basic-info-section.tsx
│   │   │   │   │   ├── communication-section.tsx
│   │   │   │   │   ├── preferences-section.tsx
│   │   │   │   │   ├── privacy-safety-section.tsx
│   │   │   │   │   └── travel-details-section.tsx
│   │   │   │   ├── DestinationCard.tsx
│   │   │   │   ├── group-media-section.tsx
│   │   │   │   ├── GroupCoverCard.tsx
│   │   │   │   ├── GroupCreationForm.tsx
│   │   │   │   ├── GroupForm.tsx
│   │   │   │   ├── join-group-button.tsx
│   │   │   │   └── MyGroupCard.tsx
│   │   │   ├── hooks
│   │   │   │   └── use-settings-tabs.ts
│   │   │   └── lib
│   │   │       └── validation
│   │   │           └── groupFormSchema.ts
│   │   ├── interests
│   │   │   └── components
│   │   │       ├── InterestCard.tsx
│   │   │       └── InterestResults.tsx
│   │   ├── invitations
│   │   │   └── components
│   │   │       ├── InvitationCard.tsx
│   │   │       ├── InvitationCardSkeleton.tsx
│   │   │       └── InvitationResults.tsx
│   │   ├── invite
│   │   │   └── components
│   │   │       ├── invite-teammember.tsx
│   │   │       ├── InviteModal.tsx
│   │   │       ├── remove-member-modal.tsx
│   │   │       ├── status-badge.tsx
│   │   │       ├── teammate-row.tsx
│   │   │       └── user-tag-input.tsx
│   │   ├── onboarding
│   │   │   └── components
│   │   │       └── ProfileSetupForm.tsx
│   │   └── profile
│   │       ├── components
│   │       │   ├── create-post-modal.tsx
│   │       │   ├── followers-following.tsx
│   │       │   ├── profile-image-modal.tsx
│   │       │   ├── section-row.tsx
│   │       │   ├── user-card.tsx
│   │       │   ├── user-list.tsx
│   │       │   └── user-profile.tsx
│   │       ├── hooks
│   │       │   ├── use-profile-data.ts
│   │       │   ├── use-profile-edit-tabs.ts
│   │       │   └── use-profile-field-handler.ts
│   │       └── lib
│   │           ├── options.ts
│   │           ├── types.ts
│   │           └── user.ts
│   ├── lib
│   │   ├── data
│   │   │   └── topPicksDestinations.ts
│   │   ├── email-templates
│   │   │   ├── group-invite.ts
│   │   │   ├── layout.ts
│   │   │   ├── password-reset.ts
│   │   │   └── waitlist-confirmation.ts
│   │   ├── matching
│   │   │   ├── config.ts
│   │   │   ├── group.ts
│   │   │   └── solo.ts
│   │   ├── notifications
│   │   │   └── createNotification.ts
│   │   ├── brevo.ts
│   │   ├── cloudinary.ts
│   │   ├── fetchGoogleImage.ts
│   │   ├── fetchPexelsImage.ts
│   │   ├── gemini.ts
│   │   ├── geocoding-client.ts
│   │   ├── geocoding.ts
│   │   ├── migrate-local-to-cloudinary.ts
│   │   ├── redis.ts
│   │   ├── send-invite-email.dev.ts
│   │   ├── send-invite-email.ts
│   │   ├── send-waitlist-confirmation.ts
│   │   ├── settings.ts
│   │   ├── supabase-admin.ts
│   │   ├── supabase.ts
│   │   ├── supabaseAdmin.ts
│   │   ├── syncUserToSupabase.ts
│   │   ├── test-cloudinary.ts
│   │   ├── test-geocoding.ts
│   │   └── uploadthing.ts
│   ├── public
│   │   ├── 29.jpg
│   │   └── 29.webp
│   ├── shared
│   │   ├── components
│   │   │   ├── charts
│   │   │   │   ├── TripsBarChart.tsx
│   │   │   │   └── TripTypePieChart.tsx
│   │   │   ├── chat
│   │   │   │   └── chat-actions-dropdown.tsx
│   │   │   ├── DoneTripsCard
│   │   │   │   └── DoneTripsCard.tsx
│   │   │   ├── event-calendar
│   │   │   │   ├── hooks
│   │   │   │   │   ├── use-current-time-indicator.ts
│   │   │   │   │   └── use-event-visibility.ts
│   │   │   │   ├── agenda-view.tsx
│   │   │   │   ├── calendar-dnd-context.tsx
│   │   │   │   ├── constants.ts
│   │   │   │   ├── day-view.tsx
│   │   │   │   ├── draggable-event.tsx
│   │   │   │   ├── droppable-cell.tsx
│   │   │   │   ├── event-calendar.tsx
│   │   │   │   ├── event-dialog.tsx
│   │   │   │   ├── event-item.tsx
│   │   │   │   ├── events-popup.tsx
│   │   │   │   ├── index.ts
│   │   │   │   ├── month-view.tsx
│   │   │   │   ├── types.ts
│   │   │   │   ├── utils.ts
│   │   │   │   └── week-view.tsx
│   │   │   ├── GroupCard
│   │   │   │   ├── GroupCard-list.tsx
│   │   │   │   └── GroupCard.tsx
│   │   │   ├── heatmap
│   │   │   │   └── TravelHeatmap.tsx
│   │   │   ├── Itinerary
│   │   │   │   ├── Itinerary-ui.tsx
│   │   │   │   └── manage-events-modal.tsx
│   │   │   ├── landing
│   │   │   │   ├── Audience.tsx
│   │   │   │   ├── Features.tsx
│   │   │   │   ├── FinalCTA.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   ├── Hero.tsx
│   │   │   │   ├── HowItWorks.tsx
│   │   │   │   ├── Safety.tsx
│   │   │   │   └── WaitlistModal.tsx
│   │   │   ├── layout
│   │   │   │   ├── app-layout-wrapper.tsx
│   │   │   │   ├── app-sidebar.tsx
│   │   │   │   ├── bottom-nav.tsx
│   │   │   │   ├── direct-chat-skeleton.tsx
│   │   │   │   ├── groups-layout-wrapper.tsx
│   │   │   │   ├── inbox-chat-list-skeleton.tsx
│   │   │   │   ├── Inbox.tsx
│   │   │   │   ├── layout-wrapper.tsx
│   │   │   │   ├── nav-main.tsx
│   │   │   │   ├── nav-projects.tsx
│   │   │   │   ├── nav-secondary.tsx
│   │   │   │   ├── nav-user.tsx
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── Navbarv2.tsx
│   │   │   │   ├── NavbarV3.tsx
│   │   │   │   ├── profile-edit-layout-wrapper.tsx
│   │   │   │   ├── profile-edit-sidebar.tsx
│   │   │   │   ├── settings-layout-wrapper.tsx
│   │   │   │   ├── settings-sidebar.tsx
│   │   │   │   ├── sidebar-context.tsx
│   │   │   │   ├── sidebar-menu-client.tsx
│   │   │   │   ├── sidebar-menu.tsx
│   │   │   │   ├── sidebar-wrapper.tsx
│   │   │   │   └── site-header.tsx
│   │   │   ├── settings
│   │   │   │   ├── account-section.tsx
│   │   │   │   ├── danger-zone-section.tsx
│   │   │   │   ├── index.ts
│   │   │   │   ├── security-section.tsx
│   │   │   │   └── settings-sidebar.tsx
│   │   │   ├── Todo-Checklist
│   │   │   │   └── Todo-checklist.tsx
│   │   │   ├── ui
│   │   │   │   ├── alert-dialog.tsx
│   │   │   │   ├── avatar.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── breadcrumb.tsx
│   │   │   │   ├── button.tsx
│   │   │   │   ├── calendar.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── chart.tsx
│   │   │   │   ├── checkbox.tsx
│   │   │   │   ├── collapsible.tsx
│   │   │   │   ├── command.tsx
│   │   │   │   ├── DashboardCard.tsx
│   │   │   │   ├── date-picker.tsx
│   │   │   │   ├── DatePicker.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   ├── edit-multi-select-modal.tsx
│   │   │   │   ├── edit-select-modal.tsx
│   │   │   │   ├── field.tsx
│   │   │   │   ├── form.tsx
│   │   │   │   ├── GroupPreviewCard.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── InputField.tsx
│   │   │   │   ├── label.tsx
│   │   │   │   ├── location-autocomplete.tsx
│   │   │   │   ├── PendingInviteCard.tsx
│   │   │   │   ├── popover.tsx
│   │   │   │   ├── radio-group.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── separator.tsx
│   │   │   │   ├── sheet.tsx
│   │   │   │   ├── sidebar.tsx
│   │   │   │   ├── skeleton.tsx
│   │   │   │   ├── SkeletonCard.tsx
│   │   │   │   ├── slider.tsx
│   │   │   │   ├── sonner.tsx
│   │   │   │   ├── switch.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   ├── textarea.tsx
│   │   │   │   ├── TextAreaField.tsx
│   │   │   │   ├── time-picker.tsx
│   │   │   │   ├── timeline.tsx
│   │   │   │   ├── toast.tsx
│   │   │   │   ├── toaster.tsx
│   │   │   │   ├── ToggleButtonGroup.tsx
│   │   │   │   ├── tooltip.tsx
│   │   │   │   └── TripSummaryCard.tsx
│   │   │   ├── auth-provider.tsx
│   │   │   ├── comp-531.tsx
│   │   │   ├── comp-542.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   ├── DestinationCard.tsx
│   │   │   ├── direct-message-listener.tsx
│   │   │   ├── google-image-demo.tsx
│   │   │   ├── google-maps-viewer.tsx
│   │   │   ├── image-upload.tsx
│   │   │   ├── media-viewer-modal.tsx
│   │   │   ├── pexels-image-demo.tsx
│   │   │   ├── profile-crop-modal.tsx
│   │   │   ├── protected-route.tsx
│   │   │   ├── ReportDialog.tsx
│   │   │   ├── search-form.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── TopPicksSection.tsx
│   │   │   ├── UploadButton.tsx
│   │   │   └── UserAvatarFallback.tsx
│   │   ├── hooks
│   │   │   ├── use-block-status.ts
│   │   │   ├── use-direct-inbox.ts
│   │   │   ├── use-direct-messages.ts
│   │   │   ├── use-mobile.ts
│   │   │   ├── use-toast.tsx
│   │   │   ├── use-total-unread-count.ts
│   │   │   ├── use-user-profile.ts
│   │   │   ├── useDirectChat.ts
│   │   │   ├── useGroupChat.ts
│   │   │   ├── useGroupEncryption.ts
│   │   │   ├── useGroupMembers.ts
│   │   │   ├── useGroupMembership.ts
│   │   │   ├── useNotifications.ts
│   │   │   ├── usePendingInvites.ts
│   │   │   ├── useUserGroups.tsx
│   │   │   └── useUserTrips.tsx
│   │   ├── stores
│   │   │   └── useAuthStore.ts
│   │   ├── types
│   │   │   └── notifications.ts
│   │   └── utils
│   │       ├── analytics.tsx
│   │       ├── blocked-users.ts
│   │       ├── countries.ts
│   │       ├── encryption.ts
│   │       ├── geoUtils.ts
│   │       ├── getUserUuidByClerkId.ts
│   │       ├── jobs.ts
│   │       ├── notificationHelpers.ts
│   │       └── utils.ts
│   ├── styles
│   │   ├── dev-theme.css
│   │   ├── globals.css
│   │   └── new-title.css
│   ├── types
│   │   ├── index.ts
│   │   ├── leaflet-defaulticon-compatibility.ts
│   │   ├── react-calendar-heatmap.d.ts
│   │   └── sib-api-v3-sdk.d.ts
│   ├── instrumentation-client.ts
│   ├── instrumentation.ts
│   └── middleware.ts
├── supabase
│   └── migrations
│       └── MVP_MATCH_GROUPS_OPTIMIZATION.sql
├── .env.example
├── .env.local
├── .eslintrc.json
├── .gitignore
├── add_ai_overview_column.js
├── ATTRIBUTES_QUICK_REFERENCE.md
├── available_models.txt
├── bfg-1.14.0.jar
├── browser-test-solo-matching.js
├── clear-and-setup-sessions.js
├── CLOUDINARY_SETUP.md
├── components.json
├── COMPREHENSIVE_E2E_TEST_REPORT.md
├── create-comprehensive-test-data.js
├── create-profiles-for-existing-users.js
├── create-redis-sessions-for-existing-users.js
├── create-redis-test-sessions.js
├── create-simple-test-data.js
├── create-supabase-users.js
├── debug-budget-calculation.js
├── debug-distance.js
├── debug-groups.js
├── debug-match-solo.js
├── debug-matching-issue.js
├── debug-real-user-scenario.js
├── debug-redis-connection.js
├── debug-supabase-constraints.js
├── DELETED_USERS_CHAT_VERIFICATION.md
├── DEV_SETUP.md
├── DIRECT_CHAT_DELETED_USERS_VERIFICATION.md
├── docker-compose.yml
├── E2E_ENCRYPTION_SETUP.md
├── EXPLORE_MATCHING_ALGORITHM_EXPLAINED.md
├── FIX_TRUNCATED_AI_CONTENT.sql
├── fix-database-schema.js
├── fix-date-of-birth-column.js
├── generate_tree.js
├── generate-fresh-test-data.js
├── GROUP_CHAT_SETUP.md
├── IMPLEMENTED_MVP_FEATURES.md
├── insert-solo-matching-test-data-alternative.sql
├── insert-solo-matching-test-data-corrected.sql
├── insert-solo-matching-test-data-final.sql
├── insert-solo-matching-test-data-fixed.sql
├── insert-solo-matching-test-data-overlapping-dates.js
├── insert-solo-matching-test-data.sql
├── list-models-fetch.js
├── MATCHING_ATTRIBUTES_REFERENCE.md
├── next-env.d.ts
├── next.config.mjs
├── package-lock.json
├── package.json
├── populate-groups-data.js
├── postcss.config.mjs
├── PRODUCTION_TESTING_SUMMARY.md
├── PROJECT_STRUCTURE.md
├── quick-start.js
├── README.md
├── sentry.edge.config.ts
├── sentry.server.config.ts
├── setup-dev.js
├── simple-test.js
├── SOLO_MATCHING_DATA_INSERTION_GUIDE.md
├── SOLO_MATCHING_DATA_REPORT.md
├── SOLO_MATCHING_FILTERS_ANALYSIS.md
├── SOLO_MATCHING_FINAL_FIX.md
├── SOLO_MATCHING_FIXES_SUMMARY.md
├── SOLO_MATCHING_SETUP_GUIDE.md
├── sorted_destinations.js
├── tailwind.config.ts
├── TEAM_SETUP.md
├── test_production_user.md
├── test-algorithm-flow.js
├── test-august-2025-scenario.js
├── test-cloud-redis.js
├── test-comprehensive-matching.js
├── test-data-source-verification.js
├── test-database-schema.js
├── test-deleted-users-chat.js
├── test-direct-chat-deleted-users.js
├── test-filter-boost.js
├── test-final-matching.js
├── test-gemini-latest.js
├── test-gemini-lite.js
├── test-gemini-models.js
├── test-geocoding.js
├── test-group-features.js
├── test-group-matching-endpoint.js
├── test-group-matching.js
├── test-group-travel-ui.js
├── test-improved-matching.js
├── test-matching-workflow.js
├── test-multiple-groups.js
├── test-new-user-session.js
├── test-production-30-users-e2e.js
├── test-production-algorithm-unit.js
├── test-production-redis-integration.js
├── test-production-redis.js
├── test-real-data-solo-matching.js
├── test-real-time-matching.js
├── test-redis-basic.js
├── test-redis-connection.js
├── test-redis-session-persistence.js
├── test-redis-simple.js
├── test-redis-status.js
├── test-search-flow.js
├── test-solo-api-fix.js
├── test-solo-filters.js
├── test-solo-matching-algorithm.js
├── test-solo-matching-api.js
├── test-solo-matching-comprehensive.js
├── test-solo-matching-fixes.js
├── test-solo-matching-workflow.js
├── test-supabase-api.js
├── test-supabase-solo-data.js
├── test-tab-api-calls.js
├── testing_production_redis.md
├── testing_production-unit1.md
├── TODO_TEMPLATE.md
├── TODO.md
├── tsconfig.json
├── tsconfig.tsbuildinfo
├── vercel.json
├── verify-solo-matching-workflow.js
└── world.json
```
