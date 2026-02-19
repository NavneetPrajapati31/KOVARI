# Build ML Training Dataset - Strict Specification Guide

**Objective:** Generate high-quality training data following strict methodology  
**Target:** 15,000-30,000 match interaction events with diverse features

---

## 🎯 Quick Start

```bash
# 1. Generate dataset (20,000 samples)
python src/lib/ai/datasets/build_ml_training_dataset.py

# 2. Split into train/val
python src/lib/ai/datasets/split_dataset.py

# 3. Verify quality
python analyze-training-data.py

# 4. Train model
python src/lib/ai/datasets/train_model.py
```

---

## 📋 What This Script Does

### 1. **Generates Realistic Features**

**Primary Features (85% influence):**
- `destinationScore`: 40% same, 20% nearby, 20% regional, 20% different
- `dateOverlapScore`: Realistic overlap distribution (25% no overlap, 75% various overlaps)
- `budgetScore`: Natural spread using Beta distribution

**Secondary Features (15% influence):**
- `interestScore`: Beta(2,2) distribution
- `personalityScore`: Beta(2,2) distribution  
- `ageScore`: Beta(3,2) distribution

### 2. **Calculates Compatibility**

Uses hierarchical weights:
- 40% destination
- 30% date overlap
- 15% budget
- 7% interest
- 5% personality
- 3% age

**Hard rejection:** If destination=0 OR dateOverlap=0 → compatibility × 0.25

### 3. **Converts to Probability**

Steep sigmoid: `prob = 1 / (1 + exp(-9*(compatibility - 0.6)))`

Prevents clustering near 0.5

### 4. **Generates Labels**

Bernoulli distribution based on probability (realistic uncertainty)

### 5. **Cleans Data**

- Removes duplicate feature vectors
- Removes constant columns
- Checks for missing values

### 6. **Validates Quality**

- Class balance (40-55% positive)
- Feature-label correlations
- Probability distribution (should span 0.05-0.95)
- Duplicate rate (<10%)

---

## 📊 Expected Output

### Dataset Schema

```
destinationScore | dateOverlapScore | budgetScore | interestScore | personalityScore | ageScore | compatibility | probability | label
```

**Flat table, no nested JSON**

### Quality Metrics

- **Samples:** 20,000 (adjustable)
- **Class balance:** 40-55% positive
- **Duplicate rate:** <10%
- **Probability range:** 0.05 - 0.95
- **Feature diversity:** All features have good spread

---

## 🔧 Configuration

Edit `build_ml_training_dataset.py` to adjust:

```python
TARGET_SAMPLES = 20000  # Change to 15000-30000
SIGMOID_CENTER = 0.6    # Adjust for class balance (0.55-0.65)
```

---

## ✅ Validation Checklist

After generation, verify:

- [ ] Dataset has 15,000-30,000 samples
- [ ] Class balance is 40-55% positive
- [ ] Duplicate rate <10%
- [ ] Probability spans 0.05-0.95 (not clustered)
- [ ] Primary features have stronger correlation than secondary
- [ ] No missing values
- [ ] No constant columns

---

## 🐛 Troubleshooting

### Issue: Class balance outside 40-55%

**Fix:** Adjust `SIGMOID_CENTER` in script
- Too high (>55%) → decrease to 0.55
- Too low (<40%) → increase to 0.65

### Issue: Too many duplicates

**Fix:** Increase `TARGET_SAMPLES` to generate more diverse data

### Issue: Probability clustered near 0.5

**Fix:** Check sigmoid parameters, ensure features are diverse

---

## 📝 Notes

- **No user profiles needed:** This generates synthetic interaction events
- **Deterministic:** Uses random seed for reproducibility
- **Fast:** Generates 20,000 samples in seconds
- **Clean:** Automatically removes duplicates and validates quality

---

**Ready to build? Run the script!** 🚀
