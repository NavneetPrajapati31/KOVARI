# Project Structure

```
src/
  app/
    (app)/
      [feature folders as before]
    (auth)/
      [auth pages as before]
    (marketing)/
      [marketing pages as before]
    api/
      [api routes as before]
    layout.tsx
    globals.css
    ...
  features/
    chat/
      components/
      hooks/
      types/
    groups/
      components/
      hooks/
      types/
    onboarding/
      components/
      hooks/
      types/
    profile/
      components/
      hooks/
      types/
    explore/
      components/
      hooks/
      types/
    itinerary/
      components/
      hooks/
      types/
    events/
      components/
      hooks/
      types/
    [other features...]
  shared/
    components/
      ui/
        [generic UI components: button, input, card, etc.]
      layout/
        [layout wrappers, navbars, sidebars]
      modals/
        [modals used across features]
      skeleton/
        [skeleton loaders]
      Spinner.tsx
      ...
    hooks/
      [reusable hooks]
    types/
      [shared types/interfaces]
    utils/
      [shared utility functions]
  lib/
    [external API logic, supabase, etc.]
  styles/
    [global styles, tailwind config, etc.]
```
