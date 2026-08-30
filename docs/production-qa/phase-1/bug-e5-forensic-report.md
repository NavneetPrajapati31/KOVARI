# BUG-E5 — Explore Groups Feed Forensic Report

> **Status:** FIX IMPLEMENTED — **pending physical-device production QA**  
> **Date:** 2026-08-30  
> **Severity:** P2

---

## A. Executive Summary

**Symptom:** Group cards in the mobile Explore Groups feed render incompletely (missing description, interests, languages, lifestyle policies) and the Groups tab does not fetch on first switch from Solo.

**First failed stages (confirmed):**

1. **`groupTransformer.ts`** — stripped DB/Go fields before API response (`description`, `coverImage`, group-level `languages`, lifestyle policies; mapped interests to `interests` not `tags`).
2. **`performGroupDbMatchingFallback()`** — selected `non_smokers` / `non_drinkers` but did not map them; omitted `top_interests` / `dominant_languages` from SELECT.
3. **`ExploreNotifier.setTravelMode()`** — global `hasSearched` blocked first Groups fetch after Solo search completed.

Cover image partially worked via legacy `image` key; mobile `GroupModel.fromJson` already read `image` but not `interests` → `tags`.

---

## B. Flow Trace

```text
POST /api/match-groups
     ↓
Redis SWR (v1-stable-groups-v10) OR DB fallback
     ↓
enrichGroups()
     ↓
groupTransformer.toStandard()   ← fields dropped here (Round 0)
     ↓
Mobile explore_service.matchGroups()
     ↓
GroupModel.fromJson()           ← tags/languages null when keys missing
     ↓
GroupMatchCard                  ← sections hidden when null
```

Tab switch path:

```text
Explore opens (Solo) → performSearch() → hasSearched=true
     ↓
User taps Groups tab → setTravelMode(group)
     ↓
groupMatches empty + hasSearched true → NO fetch (bug)
```

---

## C. Field Loss Matrix

| Field | DB fallback | Pre-fix transformer | Mobile reads | Post-fix transformer |
| :--- | :---: | :---: | :--- | :--- |
| `coverImage` | Yes | `image`/`avatar` only | `cover_image`, `image`, `coverImage` | All aliases emitted |
| `description` | Yes | **Dropped** | `description` | Emitted |
| `tags` | No (`top_interests` in DB) | `interests` only | `tags` (+ `interests` fallback) | `tags` + `interests` |
| `languages` | No (`dominant_languages` in DB) | **Dropped** | `languages` (+ `dominantLanguages` fallback) | Emitted |
| `smokingPolicy` | bool not mapped | **Dropped** | `non_smokers` / `smokingPolicy` | Emitted |
| `drinkingPolicy` | bool not mapped | **Dropped** | `non_drinkers` / `drinkingPolicy` | Emitted |
| `dateRange` | flat dates | flat dates only | flat dates OK | `dateRange` object + flat dates |

---

## D. Fix Implemented

| Change | File |
| :--- | :--- |
| Emit canonical + legacy group card fields | `groupTransformer.ts` |
| Select/map `top_interests`, `dominant_languages`, lifestyle flags | `fallback.ts` |
| `interests`/`topInterests` → `tags`; `dominantLanguages` → `languages` | `group.dart` |
| Per-mode `soloHasSearched` / `groupHasSearched` tab fetch | `explore_state.dart`, `explore_provider.dart` |
| Regression tests | `groupTransformer.test.ts`, `group_model_test.dart` |

**Not modified:** G2/G2b/G2b-TAP/G3, A7/A8/A10 auth flows, matching algorithms, Redis global config.

---

## E. Manual QA

**VERIFIED PASS — QA SIGN-OFF COMPLETE** (2026-08-30). See `bug-e5-fix-validation.md` — Round 2 Scenarios A–H all PASS on physical production APK.

---

## F. Related Bugs

| Bug | Status |
| :--- | :--- |
| BUG-G2 / G2b / G2b-TAP / G3 | **VERIFIED PASS** — do not modify |
| BUG-A7 / A8 / A10 | **VERIFIED PASS** — do not modify |
