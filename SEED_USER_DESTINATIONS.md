# Seed User Destinations & Search Settings

Quick reference for what destinations and settings each seed user has in their Redis session.

## 📍 Destinations Assigned to Seed Users

Based on the `create-seed-user-sessions.js` script, destinations are assigned in round-robin order:

| User | Email | Destination | Budget Range | Trip Duration |
|------|-------|-------------|--------------|---------------|
| 1. Budget Traveler | `budget.traveler@example.com` | **Goa** | ₹15,000 - ₹25,000 | 7 days (default) |
| 2. Luxury Traveler | `luxury.traveler@example.com` | **Mumbai** | ₹50,000 - ₹75,000 | 7 days (default) |
| 3. Solo Introvert | `solo.introvert@example.com` | **Delhi** | ₹25,000 - ₹40,000 | 7 days (default) |
| 4. Extrovert Group | `extrovert.group@example.com` | **Manali** | ₹25,000 - ₹40,000 | 7 days (default) |
| 5. Short Trip | `short.trip@example.com` | **Rishikesh** | ₹25,000 - ₹40,000 | 3 days |
| 6. Long Trip | `long.trip@example.com` | **Goa** | ₹25,000 - ₹40,000 | 14 days |

---

## 🎯 For Budget Traveler (`budget.traveler@example.com`)

### Your Redis Session Settings:
- **Destination:** **Goa**
- **Budget:** ₹15,000 - ₹25,000 (approximately ₹15,000)
- **Trip Duration:** 7 days
- **Dates:** ~10-17 days from now (check your session for exact dates)

### What to Fill in the Explore Page:

1. **Destination:** 
   - Type: **"Goa"** (just "Goa" works best!)
   - Or **"Goa, India"** (both formats work now)
   - The system will automatically find the coordinates

2. **Dates:**
   - **Start Date:** ~10 days from today (check your session for exact date)
   - **End Date:** ~17 days from today (7 days later)
   - Example: If today is Jan 1, use Jan 11 - Jan 18

3. **Budget:**
   - Enter: **₹15,000** to **₹25,000**
   - Or use a range like **₹20,000** (mid-range)

4. **Mode:** 
   - Select **"Solo"** (default)

### To Find Matches:

**Search for users going to the SAME destination:**
- ✅ **Goa** - You'll match with "Long Trip" user (also going to Goa)
- ✅ **Mumbai** - You might match with "Luxury Traveler" (if dates overlap)
- ✅ **Delhi** - You might match with "Solo Introvert" (if dates overlap)

**Best Match Strategy:**
- Search for **"Goa"** to find the "Long Trip" user
- Use dates that overlap with other seed users
- Budget should be compatible (₹15k-₹40k range works)

---

## 🔍 How to Check Your Exact Session Details

If you want to see your exact session settings:

```powershell
# Get your Clerk ID first
node -e "require('dotenv').config({path: '.env.local'}); const {createClerkClient} = require('@clerk/clerk-sdk-node'); const clerk = createClerkClient({secretKey: process.env.CLERK_SECRET_KEY}); clerk.users.getUserList({emailAddress: ['budget.traveler@example.com']}).then(users => { if(users && users.length > 0) { console.log('Clerk ID:', users[0].id); } });"

# Then check Redis session (replace CLERK_ID with output above)
node -e "require('dotenv').config({path: '.env.local'}); const redis = require('redis'); const client = redis.createClient({url: process.env.REDIS_URL}); client.connect().then(() => client.get('session:CLERK_ID')).then(session => { if(session) { const s = JSON.parse(session); console.log('Destination:', s.destination?.name); console.log('Budget: ₹' + s.budget); console.log('Dates:', s.startDate + ' to ' + s.endDate); } }).finally(() => client.quit());"
```

---

## 📋 Quick Search Guide

### For Best Results:

1. **Search for "Goa"** (your assigned destination)
   - You'll definitely find the "Long Trip" user
   - Dates: Use dates around 10-17 days from today

2. **Search for "Mumbai"** 
   - You might find "Luxury Traveler"
   - Budget might be different, but dates might overlap

3. **Search for "Delhi"**
   - You might find "Solo Introvert"
   - Dates and budget should be compatible

### Example Search Values:

**Destination:** `Goa` (just type "Goa" - no need for ", India")  
**Start Date:** `2026-01-14` (or ~10 days from today)  
**End Date:** `2026-01-21` (or ~17 days from today)  
**Budget:** `₹20,000` (mid-range)  
**Mode:** `Solo`

**Note:** The geocoding now supports both "Goa" and "Goa, India" formats, and has fallback coordinates for common destinations.

---

## 💡 Tips

1. **Use the same destination** as your session for guaranteed matches
2. **Overlap dates** with other seed users (they have similar date ranges)
3. **Budget flexibility:** The matching algorithm is flexible, so ₹15k-₹40k should work
4. **Check multiple destinations:** Try Goa, Mumbai, Delhi to find different matches

---

## 🎯 Recommended First Search

**As Budget Traveler, try this:**

1. Go to `/explore` page
2. Fill in:
   - **Destination:** `Goa`
   - **Start Date:** ~10 days from today
   - **End Date:** ~17 days from today  
   - **Budget:** `₹20,000`
3. Click "Search"
4. You should see matches (especially the "Long Trip" user who's also going to Goa)

---

**Note:** If you don't see matches, make sure:
- ✅ Redis sessions exist for all seed users
- ✅ Dates overlap with other users
- ✅ You're searching in "Solo" mode (not Groups)
