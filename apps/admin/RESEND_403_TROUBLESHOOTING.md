# Resend 403 Forbidden Error - Troubleshooting Guide

## Common Causes of 403 Errors

A `403 Forbidden` error from Resend typically means one of the following:

### 1. **Unverified "From" Email Address** (Most Common)
The email address you're using in the `from` field must be verified in your Resend dashboard.

**How to Fix:**
1. Go to [Resend Dashboard](https://resend.com/domains)
2. Navigate to **Domains** or **Email Addresses**
3. Add and verify the email address you're using (e.g., `noreply@kovari.com`)
4. Wait for verification email and confirm

**Current Configuration:**
- Environment variable: `RESEND_FROM_EMAIL` (defaults to `"Kovari <noreply@kovari.com>"`)
- Make sure the email part (e.g., `noreply@kovari.com`) is verified in Resend

### 2. **Invalid API Key**
The API key might be incorrect, expired, or doesn't have send permissions.

**How to Fix:**
1. Go to [Resend API Keys](https://resend.com/api-keys)
2. Verify your API key starts with `re_` (e.g., `re_xxxxxxxxxxxxx`)
3. Check that the API key has "Send Email" permissions
4. Regenerate the key if needed
5. Update `RESEND_API_KEY` in your `.env` file
6. Restart your development server

### 3. **API Key Format Issues**
- Make sure there are no extra spaces or quotes in the `.env` file
- The key should be on a single line: `RESEND_API_KEY=re_xxxxxxxxxxxxx`
- Don't wrap it in quotes unless it contains special characters

### 4. **Domain Not Verified**
If using a custom domain, it must be verified in Resend.

**How to Fix:**
1. Go to [Resend Domains](https://resend.com/domains)
2. Add your domain (e.g., `kovari.com`)
3. Add the required DNS records
4. Wait for verification

## Debugging Steps

### Check Environment Variables
```bash
# In your terminal, verify the key is loaded:
echo $RESEND_API_KEY

# Or in Node.js:
console.log(process.env.RESEND_API_KEY?.substring(0, 7)) // Should show "re_xxxx"
```

### Check Server Logs
The code now logs detailed information when sending emails:
- API key presence and length
- From/To email addresses
- Full error details

Look for these logs in your server console when attempting to send emails.

### Test with Resend API Directly
You can test your API key using curl:

```bash
curl -X POST 'https://api.resend.com/emails' \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "verified-email@yourdomain.com",
    "to": "test@example.com",
    "subject": "Test",
    "html": "<p>Test email</p>"
  }'
```

## Quick Fix Checklist

- [ ] Verify the "from" email address in Resend dashboard
- [ ] Check API key format (should start with `re_`)
- [ ] Verify API key has "Send Email" permissions
- [ ] Ensure no extra spaces/quotes in `.env` file
- [ ] Restart development server after updating `.env`
- [ ] Check server logs for detailed error messages
- [ ] Verify domain is set up if using custom domain

## Environment Variables Required

```env
# Required
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Optional (defaults to "Kovari <noreply@kovari.com>")
RESEND_FROM_EMAIL=Kovari <noreply@yourdomain.com>
```

**Important:** The email address in `RESEND_FROM_EMAIL` (or the default) must be verified in your Resend account.

## Next Steps After Fixing

1. Test sending an email via the admin panel (Warn action)
2. Check server logs for success confirmation
3. Verify email is received
4. Check Resend dashboard logs for delivery status
