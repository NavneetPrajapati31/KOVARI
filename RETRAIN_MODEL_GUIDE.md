# Retrain Model Guide

**Question:** Do I need to clean/delete the old model before retraining?

**Answer:** **No, but backing up is recommended!**

---

## 🔍 How Training Script Works

The training script (`train_model.py`) **automatically overwrites** existing model files:

- `models/match_compatibility_model.pkl` → **Overwritten**
- `models/model_features.json` → **Overwritten**
- `models/model_metadata.json` → **Overwritten**

**No manual cleanup needed** - the script handles it automatically.

---

## ✅ Recommended: Backup First

While not required, it's **good practice** to backup the old model in case the new one performs worse:

```bash
# Backup existing model
python src/lib/ai/datasets/backup_model.py

# Then retrain
python src/lib/ai/datasets/train_model.py
```

**What backup does:**
- Creates timestamped backup in `models/backups/`
- Saves: `model_YYYYMMDD_HHMMSS/match_compatibility_model.pkl`
- Allows you to restore if new model is worse

---

## 🚀 Quick Retrain (No Backup)

If you're confident the new model will be better:

```bash
# Just retrain - old model will be overwritten
python src/lib/ai/datasets/train_model.py
```

**This is safe** - the script overwrites cleanly.

---

## 📋 Step-by-Step Retrain Process

### Option 1: With Backup (Recommended)

```bash
# 1. Backup existing model
python src/lib/ai/datasets/backup_model.py

# 2. Retrain with new data
python src/lib/ai/datasets/train_model.py

# 3. Verify new model performance
python analyze-training-data.py

# 4. Test predictions
node test-ml-prediction-direct.js
```

### Option 2: Direct Retrain (No Backup)

```bash
# 1. Retrain directly
python src/lib/ai/datasets/train_model.py

# 2. Verify performance
python analyze-training-data.py
```

---

## 🔄 What Happens During Retrain

1. **Loads new training data** from `datasets/train.csv` and `datasets/val.csv`
2. **Trains new model** using XGBoost
3. **Evaluates performance** on validation set
4. **Saves model** (overwrites existing files)
5. **Saves metadata** with training metrics

**Old model is automatically replaced** - no manual deletion needed.

---

## ⚠️ Important Notes

### Feature Compatibility

**Critical:** New training data must have **same feature columns** as production code expects.

**Check:**
- New dataset has: `destinationScore`, `dateOverlapScore`, `budgetScore`, `interestScore`, `ageScore`, `personalityScore`
- Production code (`ml-scoring.ts`) expects these same features
- If features differ → model will fail at prediction time

### Model Files

After retraining, these files are updated:
- ✅ `models/match_compatibility_model.pkl` - New trained model
- ✅ `models/model_features.json` - Feature names (should match)
- ✅ `models/model_metadata.json` - Training metrics and timestamp

---

## 🧪 Verify After Retraining

1. **Check metrics:**
   ```bash
   python analyze-training-data.py
   ```
   - ROC-AUC should be >0.70 (better than old 0.66)
   - Check if model performance improved

2. **Test predictions:**
   ```bash
   node test-ml-prediction-direct.js
   ```
   - Should get valid predictions
   - Scores should vary (not all 0.485)

3. **Test via API:**
   - Make API requests
   - Check server logs for ML scores
   - Verify scores are diverse

---

## 🔙 Restore Backup (If Needed)

If new model performs worse:

```bash
# Find backup
ls models/backups/

# Restore (example)
cp models/backups/model_20240204_123456/match_compatibility_model.pkl models/
cp models/backups/model_20240204_123456/model_features.json models/
cp models/backups/model_20240204_123456/model_metadata.json models/
```

---

## ✅ Summary

| Action | Required? | Recommended? |
|--------|-----------|--------------|
| Delete old model | ❌ No | ❌ No |
| Backup old model | ❌ No | ✅ Yes |
| Just retrain | ✅ Yes | ✅ Yes |

**Bottom line:** Just run `train_model.py` - it handles everything automatically. Backup is optional but recommended.

---

**Ready to retrain?** 🚀

```bash
# Quick start (with backup)
python src/lib/ai/datasets/backup_model.py
python src/lib/ai/datasets/train_model.py
```
