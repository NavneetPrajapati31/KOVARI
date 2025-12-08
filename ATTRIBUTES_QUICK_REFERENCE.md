# Matching Attributes - Quick Reference

## 📊 Solo Matching (9 Attributes)

### Core Travel Attributes (85% total weight)
| Attribute | Weight | Type | Hard Filter |
|-----------|--------|------|-------------|
| **Destination** | 25% | `{lat, lon}` | ✅ 200km limit |
| **Date Overlap** | 20% | `string` (ISO) | ✅ Min 1-day |
| **Budget** | 20% | `number` (₹) | ❌ |
| **Interests** | 10% | `string[]` | ❌ |

### User Preference Attributes (35% total weight)
| Attribute | Weight | Type | Boostable |
|-----------|--------|------|-----------|
| **Age** | 10% | `number` | ✅ 1.5x |
| **Personality** | 5% | `string` | ✅ 1.5x |
| **Location Origin** | 5% | `{lat, lon}` | ❌ |
| **Lifestyle** | 3% | `{smoking, drinking}` | ✅ 1.5x |
| **Religion** | 2% | `string` | ✅ 1.5x |

**Total: 100% (1.0)**

---

## 📊 Group Matching (7 Attributes)

### Core Travel Attributes (60% total weight)
| Attribute | Weight | Type | Hard Filter |
|-----------|--------|------|-------------|
| **Destination** | - | `{lat, lon}` | ✅ 200km limit |
| **Budget** (avg) | 20% | `number` | ❌ |
| **Date Overlap** | 20% | `string` (ISO) | ❌ |

### Demographic Attributes (60% total weight)
| Attribute | Weight | Type |
|-----------|--------|------|
| **Interests** | 15% | `string[]` |
| **Age** (avg) | 15% | `number` |
| **Languages** | 10% | `string[]` |
| **Lifestyle** | 10% | `{smokingPolicy, drinkingPolicy}` |
| **Nationalities** | 10% | `string[]` |

**Total: 100% (1.0)**

---

## 🔍 Comparison

| Feature | Solo | Group |
|---------|------|-------|
| **Total Attributes** | 9 | 7 |
| **Hard Filters** | 4 | 1 |
| **Boostable Attributes** | 7 | 0 |
| **Distance Limit** | 200km | 200km |
| **Min Date Overlap** | 1 day (hard) | No minimum |
| **Uses Personality** | ✅ Yes | ❌ No |
| **Uses Religion** | ✅ Yes | ❌ No |
| **Uses Languages** | ❌ No | ✅ Yes |
| **Uses Nationality** | ❌ No | ✅ Yes |

---

## 🎯 Solo-Only Attributes
- Personality (introvert/ambivert/extrovert)
- Religion
- Location Origin (home city)

## 🎯 Group-Only Attributes
- Languages (communication)
- Nationalities (cultural background)
- Policies (smoking/drinking rules)

---

**For full details, see:** `MATCHING_ATTRIBUTES_REFERENCE.md`

