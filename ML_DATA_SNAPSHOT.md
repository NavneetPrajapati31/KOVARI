# ML Training Data Snapshot

**Date:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Status:** ✅ Data captured from 3 users (Budget, Luxury, Solo Introvert)

## Summary

- **Total Events:** 17
- **Event Types:**
  - Accepts: 10 (label: 1)
  - Ignores: 7 (label: 0)
  - Chats: 0
  - Unmatches: 0

- **Match Types:**
  - User-User: 17
  - User-Group: 0

## Users Who Generated Data

1. **Budget Traveler** (`budget.traveler@example.com`)
   - Destination: Goa
   - Actions: Multiple accepts and ignores

2. **Luxury Traveler** (`luxury.traveler@example.com`)
   - Destination: Mumbai
   - Actions: Multiple accepts and ignores

3. **Solo Introvert** (`solo.introvert@example.com`)
   - Destination: Delhi
   - Actions: Multiple accepts and ignores

## Data Quality

✅ **Features Normalized:** All feature scores are in [0,1] range
✅ **Labels Present:** Both 0 (ignore) and 1 (accept) labels present
✅ **Source Tagged:** All events have `"source": "rule-based"`
✅ **Preset:** All events use `"preset": "balanced"`
✅ **Match Type:** All events are `"matchType": "user_user"`

## Files

- **Raw Events:** `match_events.jsonl` (17 events)
- **Log File:** `app.log` (contains all ML events with `[ML_MATCH_EVENT]` prefix)

## Next Steps

1. Continue generating more events (target: 200-500 total)
2. Add user-group interactions (currently 0)
3. Run `build_training_set.py` to create train.csv and val.csv
4. Verify dataset quality (no PII, time-based split, etc.)

## Feature Distribution

All events include:
- `distanceScore`: [0.6, 1.0]
- `dateOverlapScore`: [0.3, 1.0]
- `budgetScore`: [0.4, 1.0]
- `interestScore`: [0, 0.575]
- `ageScore`: [0.1, 1.0]
- `personalityScore`: [0, 1.0]
