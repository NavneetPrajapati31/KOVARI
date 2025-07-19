# Project Structure

This document describes the complete, detailed project structure for a modern, scalable Next.js 14 + TypeScript + TailwindCSS application, following best practices for clarity, maintainability, and separation of concerns.

---

## Top-Level Structure

```
/
├── public/                   # Static assets (images, fonts, etc.)
├── src/                      # All source code
│   ├── app/                  # Next.js app directory (routing, pages, layouts)
│   ├── components/           # Reusable UI components (dumb/presentational)
│   ├── features/             # Feature-based modules (domain logic, smart components)
│   ├── shared/               # Shared utilities, hooks, types, and UI primitives
│   ├── styles/               # Global and theme CSS (Tailwind, custom)
│   ├── lib/                  # Library code (API clients, helpers, 3rd-party integrations)
│   ├── types/                # Global/shared TypeScript types & interfaces
│   └── constants/            # App-wide constants and enums
├── .env*                     # Environment variables
├── next.config.mjs           # Next.js configuration
├── tailwind.config.ts        # TailwindCSS configuration
├── tsconfig.json             # TypeScript configuration
├── package.json              # NPM dependencies and scripts
├── README.md                 # Project documentation
└── ...                       # Other config and meta files
```

---

## Detailed Structure

### 1. `public/`

- `favicon.ico`
- `robots.txt`
- `images/`
- `fonts/`

### 2. `src/app/`

- `(app)/`
  - `dashboard/`
    - `page.tsx`
  - `profile/`
    - `[userId]/`
      - `page.tsx`
      - `loading.tsx`
    - `edit/`
      - `general/section.tsx`
      - `personal/section.tsx`
      - `professional/section.tsx`
      - `layout.tsx`
      - `page.tsx`
    - `page.tsx`
  - `groups/`
    - `[groupId]/`
      - `chat/page.tsx`
      - `home/page.tsx`
      - `itinerary/page.tsx`
      - `settings/`
        - `danger/page.tsx`
        - `edit/page.tsx`
        - `members/page.tsx`
        - `requests/page.tsx`
        - `layout.tsx`
      - `layout.tsx`
    - `page.tsx`
  - `chat/`
    - `[userId]/page.tsx`
    - `page.tsx`
  - `events/page.tsx`
  - `explore/page.tsx`
  - `onboarding/page.tsx`
  - `invite/[token]/page.tsx`
  - `layout.tsx`
  - `page.tsx`
- `(auth)/`
  - `sign-in/[[...sign-in]]/page.tsx`
  - `sign-up/[[...sign-up]]/page.tsx`
  - `forgot-password/page.tsx`
  - `verify-email/page.tsx`
  - `sso-callback/page.tsx`
- `(marketing)/`
  - `landing/page.tsx`
  - `layout.tsx`
- `api/`
  - `check-username/route.ts`
  - `create-group/route.ts`
  - `event/route.ts`
  - `groups/[groupId]/delete/route.ts`
  - `groups/[groupId]/itinerary/[itemId]/route.ts`
  - `groups/[groupId]/join/route.ts`
  - `profile/[userId]/route.ts`
  - `profile/current/route.ts`
  - `profile/update/route.ts`
  - ... (other API routes)
- `middleware.ts`
- `global-error.tsx`

### 3. `src/components/`

- `forms/`
  - `form.tsx`
- ... (other generic, stateless UI components)

### 4. `src/features/`

- `auth/`
  - `components/`
    - `auth-form.tsx`
    - `hero-section.tsx`
- `explore/`
  - `components/`
    - `ExploreFilters.tsx`
    - `ExploreHeader.tsx`
    - `ExploreResults.tsx`
    - `GroupCard.tsx`
    - `NoResultsPlaceholder.tsx`
    - ...
  - `lib/`
    - `fetchExploreData.ts`
  - `types/`
    - `filters-state.ts`
- `groups/`
  - `components/`
    - `DestinationCard.tsx`
    - `GroupCoverCard.tsx`
    - `GroupCreationForm.tsx`
    - `GroupForm.tsx`
    - `join-group-button.tsx`
    - `MyGroupCard.tsx`
    - `edit-group-sections/`
      - `advanced-section.tsx`
      - `basic-info-section.tsx`
      - ...
  - `hooks/`
    - `use-settings-tabs.ts`
  - `lib/validation/`
    - `groupFormSchema.ts`
- `invitations/`
  - `components/`
    - `InvitationCard.tsx`
    - `InvitationResults.tsx`
- `invite/`
  - `components/`
    - `invite-teammember.tsx`
    - `InviteModal.tsx`
    - `remove-member-modal.tsx`
    - `status-badge.tsx`
    - `teammate-row.tsx`
    - `user-tag-input.tsx`
- `onboarding/`
  - `components/`
    - `ProfileSetupForm.tsx`
- `profile/`
  - `components/`
    - `section-row.tsx`
    - `user-profile.tsx`
  - `hooks/`
    - `use-profile-data.ts`
    - `use-profile-edit-tabs.ts`
    - `use-profile-field-handler.ts`
  - `lib/`
    - `types.ts`

### 5. `src/shared/`

- `components/`
  - `auth-provider.tsx`
  - `charts/`
    - `TripsBarChart.tsx`
    - `TripTypePieChart.tsx`
  - `DatePicker.tsx`
  - `google-image-demo.tsx`
  - `google-maps-viewer.tsx`
  - `Hero.tsx`
  - `image-upload.tsx`
  - `layout/`
    - `app-layout-wrapper.tsx`
    - `app-sidebar.tsx`
    - `groups-layout-wrapper.tsx`
    - `layout-wrapper.tsx`
    - `nav-main.tsx`
    - `nav-projects.tsx`
    - `nav-secondary.tsx`
    - `nav-user.tsx`
    - `Navbar.tsx`
    - `Navbarv2.tsx`
    - `NavbarV3.tsx`
    - `profile-edit-layout-wrapper.tsx`
    - `profile-edit-sidebar.tsx`
    - `settings-layout-wrapper.tsx`
    - `settings-sidebar.tsx`
    - `sidebar-wrapper.tsx`
    - `site-header.tsx`
  - `pexels-image-demo.tsx`
  - `profile-crop-modal.tsx`
  - `protected-route.tsx`
  - `search-form.tsx`
  - `Spinner.tsx`
  - `ui/`
    - `avatar.tsx`
    - `badge.tsx`
    - `breadcrumb.tsx`
    - `button.tsx`
    - `calendar.tsx`
    - `card.tsx`
    - `checkbox.tsx`
    - `collapsible.tsx`
    - `command.tsx`
    - `DashboardCard.tsx`
    - `date-picker.tsx`
    - `dialog.tsx`
    - `dropdown-menu.tsx`
    - `edit-select-modal.tsx`
    - `form.tsx`
    - `GroupPreviewCard.tsx`
    - `input.tsx`
    - `InputField.tsx`
    - `label.tsx`
    - `PendingInviteCard.tsx`
    - `popover.tsx`
    - `select.tsx`
    - `separator.tsx`
    - `sheet.tsx`
    - `sidebar.tsx`
    - `skeleton.tsx`
    - `SkeletonCard.tsx`
    - `slider.tsx`
    - `sonner.tsx`
    - `switch.tsx`
    - `textarea.tsx`
    - `TextAreaField.tsx`
    - `toast.tsx`
    - `toaster.tsx`
    - `ToggleButtonGroup.tsx`
    - `tooltip.tsx`
    - `TripSummaryCard.tsx`
    - `UploadButton.tsx`
- `hooks/`
  - `use-direct-inbox.ts`
  - `use-direct-messages.ts`
  - `use-mobile.ts`
  - `use-toast.tsx`
  - `useGroupChat.ts`
  - `useGroupEncryption.ts`
  - `useGroupMembers.ts`
  - `usePendingInvites.ts`
  - `useUserGroups.tsx`
  - `useUserTrips.tsx`
- `stores/`
  - `useAuthStore.ts`
- `utils/`
  - `analytics.tsx`
  - `countries.ts`
  - `encryption.ts`
  - `getUserUuidByClerkId.ts`
  - `jobs.ts`
  - `utils.ts`

### 6. `src/lib/`

- `email-templates/`
  - `group-invite.ts`
- `fetchGoogleImage.ts`
- `fetchPexelsImage.ts`
- `send-invite-email.dev.ts`
- `send-invite-email.ts`
- `supabase.ts`
- `syncUserToSupabase.ts`
- `uploadthing.ts`

### 7. `src/styles/`

- `dev-theme.css`
- `globals.css`

### 8. `src/types/`

- (For global/shared types, enums, interfaces)

### 9. `src/constants/`

- (For app-wide constants, enums, config)

---

## Notes

- **Feature-based structure**: Each feature (e.g., groups, profile, onboarding) has its own directory with components, hooks, types, and libs.
- **Shared UI**: All generic, reusable UI primitives are in `src/shared/components/ui/`.
- **Hooks**: Custom hooks are organized by domain/feature.
- **Types**: Prefer co-locating types, but use `src/types/` for global/shared types.
- **Constants**: Use `src/constants/` for app-wide constants and enums.
- **API routes**: All Next.js API routes are in `src/app/api/`.
- **Styling**: All styling is done via TailwindCSS, with global styles in `src/styles/`.

---

This structure is scalable, easy to navigate, and aligns with modern Next.js, TypeScript, and TailwindCSS best practices. If you need a structure for a specific use case (e.g., monorepo, micro-frontends, etc.), let me know!
