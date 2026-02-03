# Explore Matching Algorithm – Solo & Group (Detail)

This document explains **how solo and group matching work** in the explore flow, **which DB attributes** they use, and **which frontend filters are actually sent to and used by** the matching APIs (Section 5).

---

## 1. Solo matching (solo travel mode)

### 1.1 Flow

1. **User runs a search (Explore → Solo)**
   - Sends: `destination`, `budget`, `startDate`, `endDate`, `travelMode`.

2. **Session creation** – `POST /api/session`
   - Geocodes `destination` → `{ lat, lon }`.
   - Loads **profile from DB** via `getUserProfile(userId)` (needs at least `location` for validation).
   - Builds a **solo session** and stores it in **Redis** (`session:{userId}`) with TTL (e.g. 7 days).
   - **Stored in Redis:** `userId`, `destination` (name + lat/lon), `budget`, `startDate`, `endDate`, `mode: "solo"`, `interests` (from profile at creation time).
   - **Not stored in Redis:** full `static_attributes` (age, gender, personality, etc.) – they are not written to the session.

3. **Get matches** – `GET /api/match-solo?userId=...`
   - Reads **searching user’s session** from Redis.
   - Resolves `userId` → internal UUID via **`users`** (`clerk_user_id` → `id`).
   - Builds **exclusion sets** from DB (see tables below).
   - Loads **all other sessions** from Redis (`session:*`), excludes self and excluded user IDs.
   - For each **candidate session** (no `static_attributes` in Redis):
     - Fetches **`profiles`** row for that user (by `users.id` from `clerk_user_id`) and maps it to `static_attributes` used in scoring.
   - **Compatibility filter:** `isCompatibleMatch(searcherSession, candidateSession, maxDistanceKm)`:
     - Same source/destination check (home vs destination).
     - Distance between destinations ≤ `maxDistanceKm` (preset, e.g. 200 km).
     - Date overlap score &gt; 0 and destination score &gt; 0 (minimum 1-day overlap, same/nearby destination).
   - **Scoring:** `calculateFinalCompatibilityScore(searcherSession, candidateSession)` (see weights below).
   - **Threshold:** score ≥ `presetConfig.minScore`.
   - Results sorted by score, top 10 returned; profile impressions written (e.g. `profile_impressions` / destination_id).

### 1.2 Solo – attributes used in scoring

**From Redis session (searcher and each candidate):**

| Attribute               | Source                                   | Use in algo                                                |
| ----------------------- | ---------------------------------------- | ---------------------------------------------------------- |
| `destination`           | Session (geocoded)                       | Distance + destination score; hard filter (maxDistanceKm). |
| `startDate` / `endDate` | Session                                  | Date overlap score; hard filter (min 1-day overlap).       |
| `budget`                | Session                                  | Budget score.                                              |
| `interests`             | Session (from profile at session create) | Interest score; fallback below.                            |

**From DB when scoring (candidate only; searcher has no `static_attributes` in session):**

- **`profiles`** (per candidate, if `static_attributes` not in Redis):  
  `name`, `age`, `gender`, `personality`, `smoking`, `drinking`, `religion`, `job`, `languages`, `nationality`, `location`, `bio`, `interests`, `profile_photo`  
  → Mapped into `StaticAttributes` (e.g. `job` → `profession`) and used in scoring.

- **`travel_preferences`** (fallback for interests):  
  `interests` by `user_id` (resolved from `users.id` by `clerk_user_id`).  
  Used when session/profiles don’t have interests.

**Solo scoring weights (base; filter boost can change preference weights):**

| Attribute      | Weight | Notes                                                   |
| -------------- | ------ | ------------------------------------------------------- |
| destination    | 0.25   | Same/nearby destination (Haversine tiers up to 200 km). |
| dateOverlap    | 0.20   | Overlap ratio; min 1-day overlap.                       |
| budget         | 0.20   | Ratio of budget difference.                             |
| interests      | 0.10   | Jaccard similarity (with small bonus for any overlap).  |
| age            | 0.10   | From `static_attributes.age` (default 25 if missing).   |
| personality    | 0.05   | Introvert/ambivert/extrovert matrix.                    |
| locationOrigin | 0.05   | Home `location` – distance between origins.             |
| lifestyle      | 0.03   | Smoking + drinking match.                               |
| religion       | 0.02   | Exact/neutral handling.                                 |

**Solo – DB tables used**

| Table                | Use                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`              | Resolve Clerk `userId` → internal `id`; exclusion lookups.                                                                                                 |
| `profiles`           | Candidate `static_attributes` for scoring (age, gender, personality, location, smoking, drinking, religion, job, languages, nationality, interests, etc.). |
| `travel_preferences` | Fallback `interests` for searcher/candidate when not in session or profile.                                                                                |
| `matches`            | Exclude pairs already matched for same `destination_id`.                                                                                                   |
| `match_skips`        | Exclude skipped users for same `destination_id`, `match_type = 'solo'`.                                                                                    |
| `user_flags`         | Exclude reported users (global).                                                                                                                           |
| `match_interests`    | Exclude users with pending interest sent/received for same destination.                                                                                    |
| Redis `session:*`    | All solo sessions (searcher + candidates); no full profile, only travel + interests.                                                                       |

---

## 2. Group matching (group travel mode)

### 2.1 Flow

1. **User runs a search (Explore → Group)**
   - Sends: `destination`, `budget`, `startDate`, `endDate`, plus filters: `age`, `languages`, `interests`, `smoking`, `drinking`, `nationality`.

2. **Match groups** – `POST /api/match-groups`
   - Geocodes `destination` → `userDestinationCoords`.
   - Builds a **user profile** for the algorithm from request body:  
     `userId`, `destination`, `budget`, `startDate`, `endDate`, `age`, `languages`, `interests`, `smoking`, `drinking`, `nationality`.
   - Resolves `userId` → internal UUID via **`users`**.
   - Builds **exclusion lists** from DB (skips, reports, memberships, interests for groups).
   - Fetches **groups** from DB (see columns below), `status = 'active'`, excluding creator and excluded IDs.
   - For each group, geocodes `destination`; keeps only groups within **preset `maxDistanceKm`** (e.g. 200 km).
   - Loads **creator profiles** for nationality: `profiles` (`user_id`, `name`, `username`, `profile_photo`, `nationality`).
   - Maps each group + coords into a **GroupProfile** (see below).
   - **Scoring:** `findGroupMatchesForUser(userProfile, groupProfiles, maxDistanceKm)`:
     - Hard filter: `isWithinDistance(user.destination, group.destination, maxDistanceKm)`.
     - Then weighted score per group (see weights below).
   - **Threshold:** score ≥ `presetConfig.minScore`.
   - Returns transformed list (group id, name, destination, budget, dates, tags/interests, creator, etc.).

### 2.2 Group – attributes used

**From request body (user profile for algo):**

- `destination` (geocoded), `budget`, `startDate`, `endDate`, `age`, `languages`, `interests`, `smoking`, `drinking`, `nationality`.

**From DB – groups:**

| Column (groups)                               | Use in algo                                                           |
| --------------------------------------------- | --------------------------------------------------------------------- |
| `id`                                          | Group id, exclusion, response.                                        |
| `name`                                        | Response.                                                             |
| `destination`                                 | Geocoded → distance filter + GroupProfile.                            |
| `budget`                                      | → `averageBudget`.                                                    |
| `start_date` / `end_date`                     | → `startDate` / `endDate` (date overlap score).                       |
| `creator_id`                                  | Exclude own groups; link to profiles for nationality.                 |
| `non_smokers`                                 | Mapped to `smokingPolicy` (Non-Smoking / Smokers Welcome / Mixed).    |
| `non_drinkers`                                | Mapped to `drinkingPolicy` (Non-Drinking / Drinkers Welcome / Mixed). |
| `dominant_languages`                          | → `dominantLanguages`.                                                |
| `top_interests`                               | → `topInterests`.                                                     |
| `average_age`                                 | → `averageAge`.                                                       |
| `members_count`, `cover_image`, `description` | Response only.                                                        |

**From DB – profiles (creators only):**

- `nationality` → `dominantNationalities` for each group (used in background score).

**Group scoring weights:**

| Attribute   | Weight | Notes                                                |
| ----------- | ------ | ---------------------------------------------------- |
| budget      | 0.20   | User vs group `averageBudget`.                       |
| dateOverlap | 0.20   | User vs group dates.                                 |
| interests   | 0.15   | Jaccard(user.interests, group.topInterests).         |
| age         | 0.15   | User age vs group `averageAge`.                      |
| language    | 0.10   | Jaccard(user.languages, group.dominantLanguages).    |
| lifestyle   | 0.10   | Smoking/drinking vs group policies.                  |
| background  | 0.10   | User nationality in group’s `dominantNationalities`. |

**Group – DB tables used**

| Table               | Use                                                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `users`             | Resolve Clerk → internal id; exclude own groups.                                                                                          |
| `groups`            | All group attributes above (destination, budget, dates, non_smokers, non_drinkers, dominant_languages, top_interests, average_age, etc.). |
| `profiles`          | Creator `nationality` for `dominantNationalities`.                                                                                        |
| `match_skips`       | Exclude skipped groups for same `destination_id`, `match_type = 'group'`.                                                                 |
| `group_flags`       | Exclude reported groups.                                                                                                                  |
| `group_memberships` | Exclude groups user already in.                                                                                                           |
| `match_interests`   | Exclude groups user already expressed interest in (`match_type = 'group'`).                                                               |

---

## 3. Presets (both modes)

From **`src/lib/matching/config.ts`** and settings (`matching_preset`):

- **safe:** `minScore = 0.35`, `maxDistanceKm = 150`
- **balanced:** `minScore = 0.25`, `maxDistanceKm = 200` (default)
- **strict:** `minScore = 0.45`, `maxDistanceKm = 100`

Same presets are used for solo and group (min score + max distance).

---

## 4. Summary

- **Solo:** Sessions live in **Redis** (destination, budget, dates, interests). Candidate **profile** data comes from **`profiles`** (and optionally **`travel_preferences`** for interests). Exclusions use **`matches`**, **`match_skips`**, **`user_flags`**, **`match_interests`**, and **`users`**.
- **Group:** No Redis. User profile is from the **request**; group data from **`groups`** and creator **`profiles`**. Exclusions use **`match_skips`**, **`group_flags`**, **`group_memberships`**, **`match_interests`**, and **`users`**.
- **Solo** uses more profile fields (age, personality, location, lifestyle, religion) with weighted scoring; **group** uses group-level aggregates (average age, top interests, languages, smoking/drinking policies, creator nationality) with a single weighted score per group.

---

## 5. Frontend filters vs backend (what actually affects matching)

The **Explore** page (`src/app/(app)/explore/page.tsx`) has one **Search** form and one **Filters** state used for both Solo and Group tabs. The **FiltersPanel** (`src/features/explore/components/FiltersPanel.tsx`) shows the same filter controls for both modes (no tab-specific visibility). Only some of these filters are sent to the APIs; the rest are UI-only for one or both modes.

### 5.1 What the frontend sends

| Source                     | Solo travel                                                                 | Group travel                                                                                                                                                                                                                     |
| -------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **POST /api/session**      | `userId`, `destinationName`, `budget`, `startDate`, `endDate`, `travelMode` | Not called.                                                                                                                                                                                                                      |
| **GET /api/match-solo**    | `userId` (query) only. No filter query params.                              | Not called.                                                                                                                                                                                                                      |
| **POST /api/match-groups** | Not called.                                                                 | `destination`, `budget`, `startDate`, `endDate`, `userId`, plus from **filters**: `age` (= `filters.ageRange[0]`), `languages`, `interests`, `smoking` (boolean), `drinking` (boolean), `nationality` (or `"Unknown"` if "Any"). |

So for **solo**, the only values that affect the matching algorithm are: **destination**, **budget**, **startDate**, **endDate**, and the **user’s profile** (interests and location come from profile at session creation; candidate attributes come from DB). For **group**, the algorithm also receives the filter values above (age as a single number, languages, interests, smoking, drinking, nationality).

### 5.2 Filters state vs usage

| Filter (state key) | Shown in UI (FiltersPanel) | Sent for Solo? | Sent for Group?                     | Used in algo (solo) | Used in algo (group)                         |
| ------------------ | -------------------------- | -------------- | ----------------------------------- | ------------------- | -------------------------------------------- |
| `ageRange`         | Yes (slider)               | No             | Yes, as single `age` = min of range | —                   | Yes (user age vs group `averageAge`)         |
| `gender`           | Yes                        | No             | No                                  | —                   | —                                            |
| `personality`      | Yes                        | No             | No                                  | —                   | —                                            |
| `interests`        | Yes (badges)               | No             | Yes                                 | —                   | Yes (Jaccard with group `topInterests`)      |
| `travelStyle`      | No (in state only)         | No             | No                                  | —                   | —                                            |
| `budgetRange`      | No (in state only)         | No             | No; search form `budget` is sent    | —                   | —                                            |
| `smoking`          | Yes (switch)               | No             | Yes (boolean)                       | —                   | Yes (lifestyle vs group policy)              |
| `drinking`         | Yes (switch)               | No             | Yes (boolean)                       | —                   | Yes (lifestyle vs group policy)              |
| `nationality`      | No (commented out in UI)   | No             | Yes (or "Unknown" if "Any")         | —                   | Yes (background score)                       |
| `languages`        | Yes (badges)               | No             | Yes                                 | —                   | Yes (Jaccard with group `dominantLanguages`) |

**Summary:**

- **Solo:** No filter values are sent to the backend. Matching uses only the **search form** (destination, budget, dates) and **profile/session data** (session from Redis; candidate attributes from `profiles` + `travel_preferences`). The sidebar filters (age, gender, personality, interests, smoking, drinking, languages) are **not used** by the solo matching API.
- **Group:** Search form plus **age** (min of range), **languages**, **interests**, **smoking**, **drinking**, and **nationality** are sent and used. **Gender**, **personality**, **travelStyle**, and **budgetRange** are never sent. **Nationality** is sent but its control is commented out in the UI (state still exists and "Any" → `"Unknown"`).
