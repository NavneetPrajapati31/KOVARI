# How to View Server Logs

## Where Server Logs Appear

Server logs appear in the **terminal where you started the development server**.

### Finding Your Server Terminal

1. **If you started the server manually:**
   - Look for the terminal window where you ran `npm run dev`
   - All server logs will appear there in real-time

2. **If the server is running in the background:**
   - Check your terminal/command prompt windows
   - Look for output showing:
     ```
     ▲ Next.js 14.x.x
     - Local:        http://localhost:3000
     - Ready in X.XXs
     ```

3. **In VS Code/Cursor:**
   - Check the **Terminal** panel (usually at the bottom)
   - Look for the terminal tab labeled "Terminal" or "npm run dev"
   - Click on it to see the logs

## What to Look For

### ML Scoring Logs
When you make a search request, you'll see logs like:

```
🤖 ML Scoring: Rule-based=0.880, ML=0.486, Blended=0.604 (-0.276, -31.3%)
✅ Match passed: user_39Do6VdUUuQbfelx46BGLG7C7Ap - Score: 0.604
```

### Feature Debug Logs (10% of matches)
```
🔍 ML Features: {"matchType":"user_user","distance":"1.000","dateOverlap":"0.900",...}
```

### API Request Logs
```
GET /api/match-solo?userId=user_37nybpUEpjiOPnQp9qa4Xe9k6mG 200 in 54306ms
```

## How to Access Logs

### Option 1: Terminal Window
1. Find the terminal where `npm run dev` is running
2. Scroll up to see previous logs
3. Watch in real-time as requests come in

### Option 2: VS Code/Cursor Terminal Panel
1. Open the **Terminal** panel (View → Terminal or `` Ctrl+` ``)
2. Select the terminal tab running the dev server
3. Scroll to see logs

### Option 3: Check Log Files (if configured)
Some setups save logs to files:
- Check for `logs/` directory
- Look for `app.log` or similar files
- Use: `tail -f logs/app.log` (Linux/Mac) or `Get-Content logs/app.log -Wait` (PowerShell)

## Making Logs More Visible

### Increase Logging Frequency
To see feature logs more often, edit `src/lib/ai/matching/ml-scoring.ts`:

```typescript
// Change from 10% to 100% (always log)
if (true) { // Instead of: if (Math.random() < 0.1)
  console.log("🔍 ML Features:", ...);
}
```

### Filter Logs
In your terminal, you can filter for specific logs:
- **PowerShell**: `npm run dev | Select-String "ML Scoring"`
- **Bash**: `npm run dev | grep "ML Scoring"`

## Current Log Location

Based on your setup, logs are appearing in:
- **Terminal/Command Prompt** where you ran `npm run dev`
- **VS Code/Cursor Terminal Panel** (if you started it from there)

The logs you showed (lines 270-292) are from that terminal window.

## Quick Test

1. Make sure your server is running: `npm run dev`
2. Make a search request in your app
3. Watch the terminal for new log lines
4. Look for the `🤖 ML Scoring:` messages

## Troubleshooting

**If you don't see logs:**
- Check if the server is actually running
- Verify you're looking at the correct terminal
- Check if console.log is being suppressed
- Try restarting the server

**If logs are too verbose:**
- Reduce logging frequency in the code
- Use terminal filters to show only relevant logs
- Consider using a logging library with levels
