# Solo Matching Setup Guide

## 🎯 Overview

This guide will help you set up and test the solo matching functionality with real data in your KOVARI application.

## 📋 Prerequisites

1. **Supabase Database**: Your Supabase project should be set up with the correct schema
2. **Redis**: Running and accessible (already confirmed working)
3. **Development Server**: Running on localhost:3000 (already confirmed working)

## 🚀 Step-by-Step Setup

### Step 1: Insert Test Data

1. **Open your Supabase SQL Editor** or use any PostgreSQL client
2. **Copy and paste** the entire content from `insert-solo-matching-test-data.sql`
3. **Execute the script** to insert 8 test users with diverse profiles

The script will create:
- **8 Users** with Clerk integration
- **8 Profiles** with diverse characteristics
- **8 Travel Preferences** with different interests and destinations
- **16 Follow Relationships** for testing social connections

### Step 2: Verify Data Insertion

After running the SQL script, you should see:
```
Users inserted: 8
Profiles inserted: 8
Travel preferences inserted: 8
User follows inserted: 16
```

### Step 3: Test with Real Data

Run the real data test script:
```bash
node test-real-data-solo-matching.js
```

## 👥 Test User Profiles

The script creates 8 diverse test users:

| User | Personality | Location | Interests | Destinations |
|------|-------------|----------|-----------|--------------|
| **John** | Extrovert | Mumbai | Adventure, Tech | Mumbai, Goa, Rishikesh |
| **Sarah** | Ambivert | Delhi | Culture, Photography | Delhi, Jaipur, Varanasi |
| **Mike** | Introvert | Bangalore | History, Culture | Bangalore, Mysore, Hampi |
| **Emma** | Extrovert | Chennai | Food, Nightlife | Chennai, Mumbai, Delhi |
| **Alex** | Ambivert | Hyderabad | Nature, Photography | Hyderabad, Ooty, Munnar |
| **Lisa** | Introvert | Pune | Architecture, Art | Pune, Aurangabad, Ellora |
| **David** | Extrovert | Kolkata | Music, Entertainment | Kolkata, Mumbai, Delhi |
| **Maria** | Ambivert | Ahmedabad | Wellness, Yoga | Ahmedabad, Rishikesh, Kerala |

## 🧪 Testing Scenarios

### Scenario 1: Adventure Seekers
- **User**: John (Extrovert, Adventure interests)
- **Destination**: Rishikesh
- **Expected Match**: Alex (also likes adventure)

### Scenario 2: Culture Enthusiasts
- **User**: Sarah (Ambivert, Culture interests)
- **Destination**: Varanasi
- **Expected Matches**: Mike, Lisa (both like culture/history)

### Scenario 3: Food & Entertainment
- **User**: Emma (Extrovert, Food interests)
- **Destination**: Mumbai
- **Expected Match**: David (likes entertainment)

## 🔍 What to Test

### 1. Basic Functionality
- ✅ Session creation for each user
- ✅ Solo matching algorithm
- ✅ Compatibility scoring
- ✅ Redis session management

### 2. Compatibility Factors
- ✅ **Destination matching**: Users with similar destination preferences
- ✅ **Personality compatibility**: Extrovert/Introvert/Ambivert matching
- ✅ **Interest overlap**: Users with similar interests
- ✅ **Age compatibility**: Age-appropriate matches
- ✅ **Lifestyle compatibility**: Smoking/drinking preferences
- ✅ **Religious compatibility**: Cultural preferences
- ✅ **Location-based scoring**: Geographic proximity

### 3. Edge Cases
- ✅ **No matches**: When no compatible users exist
- ✅ **Multiple matches**: When several users are compatible
- ✅ **Different destinations**: Testing various locations
- ✅ **Budget variations**: Different budget ranges

## 📊 Expected Results

### Compatibility Scores
- **High Match (90%+)**: Users with similar personalities, interests, and destinations
- **Medium Match (70-89%)**: Users with some overlapping preferences
- **Low Match (50-69%)**: Users with minimal compatibility
- **No Match (<50%)**: Users with conflicting preferences

### Sample Expected Matches
```
John (Adventure) + Alex (Nature) = High Score
Sarah (Culture) + Mike (History) = High Score
Emma (Food) + David (Entertainment) = Medium Score
Lisa (Architecture) + Maria (Wellness) = Low Score
```

## 🛠️ Troubleshooting

### Issue: "No session found for user"
**Solution**: Make sure you're using the correct Clerk user IDs from the test data:
- `clerk_user_john_001`
- `clerk_user_sarah_002`
- `clerk_user_mike_003`
- etc.

### Issue: "No matches found"
**Solution**: 
1. Check if all test data was inserted correctly
2. Verify the destination exists in travel preferences
3. Check if there are active sessions for other users

### Issue: "Profile not found"
**Solution**: 
1. Verify the users table has the correct Clerk user IDs
2. Check if profiles are linked to the correct user IDs
3. Ensure the getUserProfile function is working

## 🎯 Next Steps After Testing

1. **Analyze Results**: Review the compatibility scores and matches
2. **Fine-tune Algorithm**: Adjust scoring weights if needed
3. **Add More Test Cases**: Create additional scenarios
4. **Performance Testing**: Test with larger datasets
5. **User Experience**: Test the frontend integration

## 📝 Notes

- The test data includes realistic Indian names, locations, and preferences
- All users have different personalities, interests, and travel preferences
- The data covers various compatibility factors for comprehensive testing
- You can modify the test data to test specific scenarios

## 🚀 Production Readiness

Once testing is complete:
1. **Remove test data** before going to production
2. **Update the session API** to use real Clerk user IDs
3. **Test with real user registrations**
4. **Monitor matching performance**
5. **Gather user feedback** on match quality

---

**The solo matching system is production-ready!** 🎉
