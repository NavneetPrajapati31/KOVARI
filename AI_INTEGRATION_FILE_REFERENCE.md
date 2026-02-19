# AI Integration - File-by-File Reference

**Quick Reference:** This document maps specific files in the codebase to AI integration opportunities.

---

## 🎯 Matching Algorithm Files

### `src/lib/matching/solo.ts`
**Current Function:** Rule-based compatibility scoring  
**AI Integration Points:**
- Line ~352: `calculateFinalCompatibilityScore()` → Add ML-based scoring
- Line ~398: `calculateJaccardSimilarity()` → Add semantic similarity (Word2Vec/BERT)
- Line ~394: `getPersonalityCompatibility()` → Add personality prediction from bio
- Line ~29: `calculateDynamicWeights()` → Add reinforcement learning for weight optimization

**Suggested AI Module:** `src/lib/ai/matching/ml-scoring.ts`

---

### `src/lib/matching/group.ts`
**Current Function:** Group matching algorithm  
**AI Integration Points:**
- Line ~179: `findGroupMatchesForUser()` → Add ML-based group recommendations
- Line ~210: `calculateJaccardSimilarity()` → Add semantic interest matching
- Line ~203: `calculateBudgetScore()` → Add budget optimization suggestions

**Suggested AI Module:** `src/lib/ai/recommendations/group-recommender.ts`

---

### `src/app/api/match-solo/route.ts`
**Current Function:** Solo matching API endpoint  
**AI Integration Points:**
- Line ~164: After compatibility scoring → Add match success prediction
- Line ~181: Before returning results → Add personalized ranking
- Line ~191: Interest matching → Add semantic interest analysis

**Suggested AI Module:** `src/lib/ai/predictions/match-success-predictor.ts`

---

### `src/app/api/match-groups/route.ts`
**Current Function:** Group matching API endpoint  
**AI Integration Points:**
- After group matching → Add group recommendation ranking
- Before returning → Add personalized suggestions

**Suggested AI Module:** `src/lib/ai/recommendations/group-recommender.ts`

---

## 💬 Chat & Messaging Files

### `src/app/api/groups/[groupId]/messages/route.ts`
**Current Function:** Group message posting  
**AI Integration Points:**
- Line ~123: `POST` function → Add message moderation before insertion
- Line ~136: After reading body → Check message content with AI
- Line ~219: Before `insert()` → Moderate and flag if needed

**Suggested AI Module:** `src/lib/ai/moderation/chat-moderation.ts`

---

### `src/shared/hooks/useDirectChat.ts`
**Current Function:** Direct chat hook  
**AI Integration Points:**
- Line ~165: `sendMessage()` → Add message moderation
- Line ~194: Before encryption → Check content safety
- After message sent → Generate reply suggestions

**Suggested AI Module:** 
- `src/lib/ai/moderation/chat-moderation.ts`
- `src/lib/ai/nlp/chat-suggestions.ts`

---

### `src/shared/hooks/useGroupChat.ts`
**Current Function:** Group chat hook  
**AI Integration Points:**
- Line ~188: `sendMessage()` → Add moderation
- Line ~202: Before encryption → Content safety check
- After sending → Generate conversation suggestions

**Suggested AI Module:**
- `src/lib/ai/moderation/chat-moderation.ts`
- `src/lib/ai/nlp/chat-suggestions.ts`

---

### `src/app/(app)/chat/[userId]/page.tsx`
**Current Function:** Direct chat page  
**AI Integration Points:**
- Line ~1428: Message input area → Add smart reply suggestions UI
- Before sending → Show moderation warnings

**Suggested AI Module:** `src/lib/ai/nlp/chat-suggestions.ts`

---

## 🖼️ Media & Image Files

### `src/app/api/direct-chat/media/route.ts`
**Current Function:** Direct chat media upload  
**AI Integration Points:**
- Before saving media → Add image/video moderation
- Check for inappropriate content
- Verify image authenticity

**Suggested AI Module:** `src/lib/ai/moderation/image-moderation.ts`

---

### `src/app/api/groups/[groupId]/media/route.ts`
**Current Function:** Group media upload  
**AI Integration Points:**
- Before upload → Moderate images/videos
- Check content safety
- Auto-tag images with destinations/activities

**Suggested AI Module:**
- `src/lib/ai/moderation/image-moderation.ts`
- `src/lib/ai/vision/photo-organization.ts`

---

### `src/shared/components/profile-crop-modal.tsx`
**Current Function:** Profile picture upload/crop  
**AI Integration Points:**
- After image selection → Assess photo quality
- Suggest better photos
- Detect fake/stock images

**Suggested AI Module:**
- `src/lib/ai/vision/photo-quality.ts`
- `src/lib/ai/safety/fake-profile-detector.ts`

---

## 👤 Profile & User Management Files

### `src/features/onboarding/components/ProfileSetupForm.tsx`
**Current Function:** User profile setup  
**AI Integration Points:**
- Line ~513: `submitProfileAndPreferences()` → Add fake profile detection
- Line ~590: Before saving interests → Suggest missing interests
- Bio field → Generate bio suggestions

**Suggested AI Module:**
- `src/lib/ai/safety/fake-profile-detector.ts`
- `src/lib/ai/nlp/bio-generator.ts`
- `src/lib/ai/profile/personality-predictor.ts`

---

### `src/app/api/profile/route.ts`
**Current Function:** Profile API endpoint  
**AI Integration Points:**
- `POST` method → Validate profile authenticity
- Check for suspicious patterns
- Suggest profile improvements

**Suggested AI Module:** `src/lib/ai/safety/fake-profile-detector.ts`

---

### `src/app/(app)/profile/[userId]/page.tsx`
**Current Function:** Profile viewing page  
**AI Integration Points:**
- Line ~34: `fetchUserProfile()` → Add trust score calculation
- Display AI-generated insights about user

**Suggested AI Module:** `src/lib/ai/safety/fake-profile-detector.ts`

---

## 🛡️ Safety & Moderation Files

### `src/app/api/flags/route.ts`
**Current Function:** User/group flagging  
**AI Integration Points:**
- Line ~20: `POST` function → Auto-prioritize flags
- Line ~37: After parsing body → Predict flag severity
- Before saving → Check if auto-action is possible

**Suggested AI Module:** `apps/admin/lib/ai/flag-prioritizer.ts`

---

### `apps/admin/app/api/admin/flags/route.ts`
**Current Function:** Admin flag management  
**AI Integration Points:**
- Flag listing → Sort by AI-predicted priority
- Flag review → Show AI suggestions
- Auto-approve/reject obvious cases

**Suggested AI Module:**
- `apps/admin/lib/ai/flag-prioritizer.ts`
- `apps/admin/lib/ai/auto-moderation.ts`

---

### `apps/admin/lib/groupSafetyHandler.ts`
**Current Function:** Group safety handling  
**AI Integration Points:**
- Line ~65: `handleOrganizerTrustImpact()` → Use ML for trust scoring
- Line ~84: Auto-flag threshold → Use predictive models

**Suggested AI Module:** `src/lib/ai/safety/fake-profile-detector.ts`

---

## 🔍 Explore & Recommendations Files

### `src/features/explore/lib/fetchExploreData.ts`
**Current Function:** Explore data fetching  
**AI Integration Points:**
- Before returning results → Add personalized destination recommendations
- Filter results → Rank by AI-predicted relevance

**Suggested AI Module:** `src/lib/ai/recommendations/destination-recommender.ts`

---

### `src/app/api/travel-preferences/route.ts`
**Current Function:** Travel preferences API  
**AI Integration Points:**
- Line ~12: `POST` function → Suggest missing preferences
- Recommend destinations based on preferences

**Suggested AI Module:** `src/lib/ai/recommendations/destination-recommender.ts`

---

## 📅 Events & Itinerary Files

### `src/app/api/events/route.ts`
**Current Function:** Events API  
**AI Integration Points:**
- Event listing → Add personalized event recommendations
- Rank events by user interest

**Suggested AI Module:** `src/lib/ai/recommendations/event-recommender.ts`

---

### `src/app/api/Itinerary/route.ts`
**Current Function:** Itinerary management  
**AI Integration Points:**
- Itinerary creation → Generate AI-powered itinerary suggestions
- Optimize itinerary based on location, time, budget

**Suggested AI Module:** `src/lib/ai/nlp/itinerary-generator.ts`

---

## 📊 Dashboard & Analytics Files

### `src/app/(app)/dashboard/page.tsx`
**Current Function:** User dashboard  
**AI Integration Points:**
- Display AI-generated insights
- Show churn risk predictions
- Suggest actions to improve profile/matches

**Suggested AI Module:**
- `src/lib/ai/predictions/churn-predictor.ts`
- `src/lib/ai/recommendations/destination-recommender.ts`

---

### `src/features/dashboard/GalleryCard.tsx`
**Current Function:** Travel gallery display  
**AI Integration Points:**
- Auto-organize photos into albums
- Auto-tag photos with locations/activities
- Suggest photo highlights

**Suggested AI Module:** `src/lib/ai/vision/photo-organization.ts`

---

## 👨‍💼 Admin Panel Files

### `apps/admin/app/api/admin/sessions/route.ts`
**Current Function:** Session management  
**AI Integration Points:**
- Line ~11: `GET` function → Detect anomalous sessions
- Identify bot accounts
- Flag suspicious patterns

**Suggested AI Module:** `apps/admin/lib/ai/anomaly-detector.ts`

---

### `apps/admin/app/api/admin/users/[id]/action/route.ts`
**Current Function:** User action endpoint  
**AI Integration Points:**
- Before taking action → Get AI recommendations
- Auto-suggest actions based on user history

**Suggested AI Module:** `apps/admin/lib/ai/auto-moderation.ts`

---

### `apps/admin/app/api/admin/groups/[id]/action/route.ts`
**Current Function:** Group action endpoint  
**AI Integration Points:**
- Before action → AI recommendation
- Auto-moderation suggestions

**Suggested AI Module:** `apps/admin/lib/ai/auto-moderation.ts`

---

### `apps/admin/app/page.tsx`
**Current Function:** Admin dashboard  
**AI Integration Points:**
- Display AI-generated insights
- Show platform health predictions
- Suggest operational improvements

**Suggested AI Module:** `apps/admin/lib/ai/insights-generator.ts`

---

## 🗂️ Image & Media Utility Files

### `src/lib/fetchGoogleImage.ts`
**Current Function:** Fetch Google images  
**AI Integration Points:**
- Verify image relevance to destination
- Check image quality

**Suggested AI Module:** `src/lib/ai/vision/destination-recognition.ts`

---

### `src/lib/fetchPexelsImage.ts`
**Current Function:** Fetch Pexels images  
**AI Integration Points:**
- Verify image relevance
- Quality assessment

**Suggested AI Module:** `src/lib/ai/vision/destination-recognition.ts`

---

## 📝 Summary: Files Requiring AI Integration

### High Priority (Safety & Core Features)
1. ✅ `src/lib/matching/solo.ts` - ML scoring
2. ✅ `src/app/api/groups/[groupId]/messages/route.ts` - Chat moderation
3. ✅ `src/shared/hooks/useDirectChat.ts` - Chat moderation
4. ✅ `src/app/api/flags/route.ts` - Flag prioritization
5. ✅ `src/features/onboarding/components/ProfileSetupForm.tsx` - Fake profile detection

### Medium Priority (User Experience)
6. ✅ `src/features/explore/lib/fetchExploreData.ts` - Recommendations
7. ✅ `src/app/api/match-solo/route.ts` - Match success prediction
8. ✅ `src/app/(app)/dashboard/page.tsx` - Insights
9. ✅ `src/app/api/Itinerary/route.ts` - Itinerary generation

### Low Priority (Nice to Have)
10. ✅ `src/features/dashboard/GalleryCard.tsx` - Photo organization
11. ✅ `apps/admin/app/api/admin/sessions/route.ts` - Anomaly detection
12. ✅ `apps/admin/app/page.tsx` - Admin insights

---

## 🚀 Quick Start: First 3 Files to Modify

1. **`src/lib/matching/solo.ts`** (Line ~352)
   - Add ML-based compatibility scoring
   - Impact: Improves match quality

2. **`src/app/api/groups/[groupId]/messages/route.ts`** (Line ~123)
   - Add message moderation
   - Impact: Improves safety

3. **`src/features/explore/lib/fetchExploreData.ts`**
   - Add destination recommendations
   - Impact: Improves user engagement

---

**Last Updated:** January 2025

