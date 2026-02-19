# Login Troubleshooting Guide

## Understanding the Console Messages

### ✅ Non-Critical Warnings (Can Ignore)

1. **"Clerk has been loaded with development keys"**
   - This is normal for development
   - Not blocking - just informational

2. **"The prop 'afterSignInUrl' is deprecated"**
   - Just a deprecation warning
   - Will be fixed in future Clerk updates
   - Not blocking

3. **CORS error for clerk-telemetry.com**
   - This is just telemetry/metrics
   - Not critical for functionality
   - Can be ignored

### ⚠️ Potential Issues

4. **400 Error on `/v1/client/sign_ins`**
   - This usually means you're already signed in
   - **Solution:** Sign out first, then sign in again

5. **"Session already exists" message**
   - This is from the Redis session creation script (not login)
   - It's just updating existing Redis sessions
   - **Not a problem** - this is expected behavior

---

## How to Login Properly

### Option 1: Sign Out First (Recommended)

1. **If you're already logged in:**
   - Look for a "Sign Out" button (usually in user menu/avatar)
   - Click it to sign out completely
   - Then go to `/sign-in` and login with seed user credentials

2. **Use Incognito/Private Window:**
   - Open a new incognito/private browser window
   - Navigate to `http://localhost:3000/sign-in`
   - Login with seed user credentials
   - This ensures no existing session conflicts

### Option 2: Clear Browser Data

1. Open browser DevTools (F12)
2. Go to Application/Storage tab
3. Clear:
   - Cookies (especially for localhost:3000)
   - Local Storage
   - Session Storage
4. Refresh the page
5. Try logging in again

---

## Seed User Login Credentials

**Password for ALL users:** `SeedUser123!`

**Email Addresses:**
1. `budget.traveler@example.com`
2. `luxury.traveler@example.com`
3. `solo.introvert@example.com`
4. `extrovert.group@example.com`
5. `short.trip@example.com`
6. `long.trip@example.com`

---

## Quick Fix Steps

### If Login Fails with 400 Error:

```powershell
# 1. Open browser DevTools (F12)
# 2. Go to Application tab → Clear Storage
# 3. Or use incognito window
# 4. Navigate to: http://localhost:3000/sign-in
# 5. Login with seed user credentials
```

### If "Session Already Exists":

This is **NOT an error** - it's from the Redis session script. You can ignore it.

The message comes from:
- `create-seed-user-sessions.js` script
- It's just updating existing Redis sessions
- This is expected and normal

---

## Verify Login Success

After logging in, you should:

1. ✅ Be redirected to `/` or `/dashboard`
2. ✅ See your user avatar/profile in the navbar
3. ✅ Be able to navigate to `/explore` page
4. ✅ See matches when searching

### Check if Login Worked:

```powershell
# Check app.log for successful login
Select-String -Pattern "POST /sign-in 200" app.log
```

If you see `POST /sign-in 200`, the login was successful!

---

## Next Steps After Login

Once logged in successfully:

1. **Go to `/explore` page**
2. **Search for matches** (set destination, dates, budget)
3. **Perform interactions:**
   - Accept matches → generates "accept" events
   - Send chat messages → generates "chat" events
   - Skip/ignore matches → generates "ignore" events
4. **Monitor events:**
   ```powershell
   (Select-String -Pattern "\[ML_MATCH_EVENT\]" app.log).Count
   ```

---

## Updated Auth Form

I've updated the auth form to:
- ✅ Automatically sign out existing sessions before signing in
- ✅ Better error handling
- ✅ Clearer error messages

The form will now handle existing sessions automatically.

---

## Still Having Issues?

1. **Check if app is running:**
   ```powershell
   # Should see Next.js server running
   npm.cmd run dev
   ```

2. **Check Clerk configuration:**
   - Verify `.env.local` has correct Clerk keys
   - Check Clerk dashboard for user status

3. **Try different browser:**
   - Use Chrome, Firefox, or Edge
   - Or use incognito mode

4. **Check network tab:**
   - Open DevTools → Network tab
   - Look for failed requests
   - Check error messages in response

---

**Remember:** The console warnings are mostly informational. Focus on whether you can actually login and use the app. If you can navigate to `/explore` and see matches, you're good to go! 🚀
