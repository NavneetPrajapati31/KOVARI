# Demo Mode Setup for Imagine Cup

This guide explains how to enable demo mode to show mock users in your Imagine Cup demo video.

## What is Demo Mode?

Demo mode allows mock/test users (like `user_mumbai_1`, `user_mumbai_2`, etc.) to:
- ✅ Appear in match results
- ✅ Work with the "Interested" feature
- ✅ Be stored in the database with virtual UUIDs

**Note:** Demo mode should only be enabled for demos/presentations. In production, it should be disabled.

## Quick Start

### Enable Demo Mode

```bash
node enable-demo-mode.js
```

This will:
- Enable mock users in match results
- Allow interest creation with mock users
- Generate virtual UUIDs for mock users automatically

### Disable Demo Mode

```bash
node disable-demo-mode.js
```

## How It Works

1. **Match Results**: When demo mode is enabled, the `/api/match-solo` endpoint will include sessions from mock users (IDs starting with `user_`)

2. **Interest Creation**: When you click "Interested" on a mock user:
   - The system generates a deterministic UUID for the mock user
   - The interest is stored in the database normally
   - Everything works as if it were a real user

3. **Virtual UUIDs**: Mock users get consistent UUIDs generated from their mock ID using SHA-256 hashing, so the same mock user always gets the same UUID.

## Available Mock Users

The following mock users are available for demos:

- `user_mumbai_1` - Female, 28, Ambivert, UI/UX Designer
- `user_mumbai_2` - Male, 30, Introvert, History Teacher
- `user_mumbai_3` - Female, 26, Extrovert, Marketing Manager
- `user_mumbai_4` - Male, 27, Ambivert, Full Stack Developer
- `user_mumbai_5` - Female, 29, Introvert, Architect

## Demo Workflow

1. **Enable demo mode**:
   ```bash
   node enable-demo-mode.js
   ```

2. **Create sessions for mock users** (if not already created):
   - Use the `/api/session` endpoint with mock user IDs
   - Example: `POST /api/session` with `userId: "user_mumbai_1"`

3. **Search for matches**:
   - Use a real user account to search
   - Mock users will appear in the results

4. **Test features**:
   - Click "Interested" on mock users
   - Test skip, report, and other features
   - Everything should work normally

5. **Disable demo mode** after your demo:
   ```bash
   node disable-demo-mode.js
   ```

## Database Schema

The `demo_mode` setting is stored in the `system_settings` table:

```sql
INSERT INTO system_settings (key, value) 
VALUES ('demo_mode', '{"enabled": true}');
```

## Troubleshooting

### Mock users not appearing?

1. Check if demo mode is enabled:
   ```sql
   SELECT * FROM system_settings WHERE key = 'demo_mode';
   ```

2. Verify mock user sessions exist in Redis:
   ```bash
   # Check Redis for session keys
   redis-cli KEYS "session:user_*"
   ```

3. Check server logs for filtering messages

### Interest creation failing?

- Make sure demo mode is enabled
- Check server logs for UUID generation messages
- Verify the interest was created in the database

## Security Note

⚠️ **Important**: Always disable demo mode in production! Mock users should never appear in a live production environment.

