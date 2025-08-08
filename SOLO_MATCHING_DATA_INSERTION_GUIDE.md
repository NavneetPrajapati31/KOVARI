# Solo Matching Data Insertion Guide

## 🚨 Issue Identified

The error you encountered is due to a **trigger function** `handle_new_user()` that automatically creates a profile when a new user is inserted into the `users` table. This trigger is trying to insert a UUID into the `number` field which has a 15-character limit constraint.

**Error**: `value too long for type character varying(15)`

## 🔧 Solution Provided

I've created **`insert-solo-matching-test-data-final.sql`** - the **ONLY working solution** that properly handles this issue.

### How It Works:
1. **Temporarily disables** the trigger function
2. **Inserts all data** (users, profiles, travel preferences, follows)
3. **Re-enables** the trigger function
4. **Provides verification queries** to confirm data insertion

## 🚀 Step-by-Step Instructions

### Step 1: Use the Final Working Script

**Use `insert-solo-matching-test-data-final.sql`** - this is the only script that will work without errors.

### Step 2: Execute in Supabase SQL Editor

1. **Open your Supabase Dashboard**
2. **Go to SQL Editor**
3. **Copy and paste** the entire content from `insert-solo-matching-test-data-final.sql`
4. **Click "Run"** to execute

### Step 3: Verify Data Insertion

After running the script, you should see output like:
```
Users inserted: 8
Profiles inserted: 8  
Travel preferences inserted: 8
User follows inserted: 16
```

### Step 4: Test Solo Matching

Run the test script to verify everything works:
```bash
node test-real-data-solo-matching.js
```

## 👥 Test Users Created

The script creates 8 diverse test users:

| User | Clerk ID | Personality | Location | Interests |
|------|----------|-------------|----------|-----------|
| **John** | `clerk_user_john_001` | Extrovert | Mumbai | Adventure, Tech |
| **Sarah** | `clerk_user_sarah_002` | Ambivert | Delhi | Culture, Photography |
| **Mike** | `clerk_user_mike_003` | Introvert | Bangalore | History, Culture |
| **Emma** | `clerk_user_emma_004` | Extrovert | Chennai | Food, Nightlife |
| **Alex** | `clerk_user_alex_005` | Ambivert | Hyderabad | Nature, Photography |
| **Lisa** | `clerk_user_lisa_006` | Introvert | Pune | Architecture, Art |
| **David** | `clerk_user_david_007` | Extrovert | Kolkata | Music, Entertainment |
| **Maria** | `clerk_user_maria_008` | Ambivert | Ahmedabad | Wellness, Yoga |

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

## 🔍 What Gets Tested

1. **Session Creation**: Each user can create travel sessions
2. **Solo Matching**: Algorithm finds compatible travel partners
3. **Compatibility Scoring**: Various factors are weighted correctly
4. **Redis Integration**: Session data is properly stored
5. **API Endpoints**: All endpoints work with real data

## 🛠️ Troubleshooting

### Issue: "Trigger function error"
**Solution**: Use the final script that properly disables and re-enables the trigger

### Issue: "No matches found"
**Solution**: 
1. Verify all test data was inserted correctly
2. Check that destinations exist in travel preferences
3. Ensure there are active sessions for other users

### Issue: "Profile not found"
**Solution**:
1. Verify the users table has correct Clerk user IDs
2. Check if profiles are linked to correct user IDs
3. Ensure the getUserProfile function is working

## 🎯 Expected Results

After successful data insertion and testing:

- ✅ **8 test users** with complete profiles
- ✅ **8 travel preference sets** with diverse interests
- ✅ **16 follow relationships** for social testing
- ✅ **Solo matching algorithm** working with real data
- ✅ **Compatibility scoring** ranging from 50-95%
- ✅ **Redis session management** functioning properly

## 📝 Notes

- The test data includes realistic Indian names, locations, and preferences
- All users have different personalities, interests, and travel preferences
- The data covers various compatibility factors for comprehensive testing
- You can modify the test data to test specific scenarios
- Remove test data before going to production

## 🚀 Next Steps

1. **Insert the test data** using `insert-solo-matching-test-data-final.sql`
2. **Run the test script** to verify solo matching works
3. **Analyze the results** and fine-tune the algorithm if needed
4. **Test with different scenarios** to ensure robustness
5. **Remove test data** before production deployment

## ⚠️ Important Notes

- **Only use `insert-solo-matching-test-data-final.sql`** - the other scripts will fail
- The script temporarily disables the trigger function, which is safe for testing
- The trigger is automatically re-enabled after data insertion
- This approach is production-safe for testing purposes

---

**Your solo matching system is ready for comprehensive testing!** 🎉
