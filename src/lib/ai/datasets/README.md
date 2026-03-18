# ML Training Dataset Builder

## Overview

This directory contains scripts for building ML training datasets from match event logs.

## Files

- `build_training_set.py` - Main script to convert logs to training datasets
- `seed-training-data.js` - Script to create seed users and groups for data collection
- `DATA_COLLECTION_GUIDE.md` - **IMPORTANT:** Guide for collecting real training data (pre-launch)
- `DAY2_FINAL_STEPS.md` - **START HERE:** Complete guide for Day 2 final steps (verification & data capture)
- `extract-events.ps1` / `extract-events.sh` - Helper scripts to extract events from logs
- `verify-dataset.ps1` - Script to verify generated dataset quality
- `requirements.txt` - Python dependencies

## Usage

### Basic Usage

```bash
python src/lib/ai/datasets/build_training_set.py match_events.jsonl
```

### Advanced Usage

```bash
python src/lib/ai/datasets/build_training_set.py \
  match_events.jsonl \
  --output-dir datasets \
  --train-ratio 0.8 \
  --min-samples 10
```

### Options

- `log_file` (required): Path to JSONL log file containing `[ML_MATCH_EVENT]` entries
- `-o, --output-dir`: Output directory for CSV files (default: `datasets`)
- `--train-ratio`: Training set ratio (default: `0.8`)
- `--min-samples`: Minimum number of samples required (default: `10`)

## Input Format

The script expects JSONL logs with the following format:

```
[ML_MATCH_EVENT] {"matchType": "user_user", "features": {...}, "outcome": "accept", "label": 1, "preset": "balanced", "timestamp": 1704123456789, "source": "rule-based"}
```

## Output

The script generates two CSV files:

- `train.csv` - Training dataset (80% of data, chronologically first)
- `val.csv` - Validation dataset (20% of data, chronologically last)

## Features

- ✅ Parses JSONL log format
- ✅ Creates binary labels from outcomes (Phase 2 logic)
- ✅ Flattens nested feature structures
- ✅ Time-based train/val split (prevents future leakage)
- ✅ Saves to CSV format (ready for ML training)

## Dependencies

```bash
# Windows (recommended)
python -m pip install -r requirements.txt

# Or if pip is in PATH
pip install -r requirements.txt
```

## Data Collection (Pre-Launch)

**⚠️ IMPORTANT:** Before building datasets, read `DATA_COLLECTION_GUIDE.md`

The guide explains how to collect **real training data** using:
- Internal test match flows (primary source)
- Seed users & groups (fixed profiles)
- Scripted interaction scenarios (human-decided outcomes)
- Time-based collection (multiple sessions/days)

**This is NOT synthetic data** - it's real behavioral data from real app flows.

## Quick Start (Day 2 Final Steps)

**📖 For complete instructions, see `DAY2_FINAL_STEPS.md`**

```bash
# 1. Create seed data (if not done already)
node src/lib/ai/datasets/seed-training-data.js

# 2. Start app with logging
npm run dev > app.log 2>&1

# 3. Perform interactions (manual or automated)
#    - Use seed profiles created above
#    - Perform match actions: accept, chat, ignore, unmatch
#    - Aim for 200-500 total events

# 4. Extract ML events (PowerShell)
.\src\lib\ai\datasets\extract-events.ps1 app.log match_events.jsonl

# 5. Build dataset
python src/lib/ai/datasets/build_training_set.py match_events.jsonl

# 6. Verify dataset
.\src\lib\ai\datasets\verify-dataset.ps1
```

## Example Workflow (Detailed)

See `DAY2_FINAL_STEPS.md` for the complete workflow with troubleshooting.

## Notes

- **Time-based split is critical**: Prevents future leakage and mirrors real deployment
- **Label logic**: Automatically computed from outcomes (accept/chat=1, ignore/unmatch=0)
- **Feature flattening**: Nested feature objects are flattened into columns

