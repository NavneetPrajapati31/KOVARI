# BUG-E5 — Explore Groups Feed Fix Validation

> **Status:** **VERIFIED PASS — QA SIGN-OFF COMPLETE**  
> **Date:** 2026-08-30  
> **Forensic reference:** `bug-e5-forensic-report.md`

---

## 1. Root Cause

**Round 1 (metadata / first-fetch):** Group Explore cards were incomplete because `groupTransformer.ts` dropped metadata fetched from the database, and the Groups tab did not auto-fetch after Solo search due to a shared `hasSearched` flag.

**Round 2 (Scenario A infinite loading):** Solo and Groups searches share one async `performSearch()` pipeline. When Solo search completed after the user switched to the Groups tab, results were written via generic `matches:` into `copyWith`, which routes to the **current** mode’s deck. Solo `MatchUser` objects were stored in `groupMatches`, triggering a permanent type-mismatch skeleton in `explore_screen.dart`.

---

## 2. Fix Summary

### Round 1

| Change | File |
| :--- | :--- |
| Emit `coverImage`, `description`, `tags`, `languages`, lifestyle policies, `dateRange` | `groupTransformer.ts` |
| DB fallback selects/maps interests + languages + lifestyle flags | `fallback.ts` |
| Parser fallbacks for legacy `interests` / `dominantLanguages` | `group.dart` |
| Per-mode first-fetch on Groups tab switch | `explore_state.dart`, `explore_provider.dart` |
| Group card UI aligned with web mobile layout | `group_match_card.dart` |

### Round 2

| Change | File |
| :--- | :--- |
| Write search results to explicit `soloMatches` / `groupMatches` (never generic `matches` on async completion) | `explore_provider.dart` |
| Search generation counter to drop stale async completions after tab/mode switch | `explore_provider.dart` |
| Mode-specific deck clears on reset / swipe removal | `explore_provider.dart` |

---

## 3. Automated Tests

| Suite | Result |
| :--- | :--- |
| `groupTransformer.test.ts` | **4/4 PASS** |
| `group_model_test.dart` | **5/5 PASS** |

---

## 4. Manual Production QA

Use a **real QA account** and **production APK** with backend deployed.

### Round 1 (commit `5ad692e1`)

| # | Scenario | Expected | Result |
| :--- | :--- | :--- | :--- |
| A | Cold Groups feed | Force-close → Explore → Groups; cards load | **FAIL** — stuck in loading forever, no cards |
| B | Card completeness | Name, destination, description, members, dates, creator | **BLOCKED** (A failed) |
| C | Cover images | Group cover images render | **BLOCKED** |
| D | Metadata | Tags, languages, lifestyle policies when present in DB | **BLOCKED** |
| E | Reload | Pull/retry; cards stay consistent | **NO RETRY** (skipped while creating before) |
| F | Warm load | Navigate away → return; deck restored without blank flash | **BLOCKED** |
| G | Solo regression | Solo Explore still works | **PASS** |
| H | Group regression | Spot-check G2/G2b (do not modify flows) | **SKIP** |

### Round 2 (2026-08-30, race-condition fix)

| # | Scenario | Expected | Result |
| :--- | :--- | :--- | :--- |
| A | Cold Groups feed | Force-close → Explore → Groups; cards load | **PASS** |
| B | Card completeness | Name, destination, description, members, dates, creator | **PASS** |
| C | Cover images | Group cover images render | **PASS** |
| D | Metadata | Tags, languages, lifestyle policies when present in DB | **PASS** |
| E | Reload | Pull/retry; cards stay consistent | **PASS** |
| F | Warm load | Navigate away → return; deck restored without blank flash | **PASS** |
| G | Solo regression | Solo Explore still works | **PASS** |
| H | Group regression | Spot-check G2/G2b (do not modify flows) | **PASS** |

---

## 5. Sign-Off

**VERIFIED PASS — QA SIGN-OFF COMPLETE** (2026-08-30, physical production APK, Scenarios A–H).
