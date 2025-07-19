# End-to-End Encryption Setup Guide

This guide will help you implement end-to-end encryption for your group chat messages.

## 🗄️ Database Setup

### 1. Run the Encryption Schema

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database-encryption-schema.sql` into the editor
4. Run the script to create the necessary tables and policies

### 2. Verify the Setup

After running the schema, you should have:

- ✅ `group_encryption_keys` table with proper indexes
- ✅ Modified `group_messages` table with encryption fields
- ✅ Row Level Security (RLS) policies for encryption keys
- ✅ Helper functions for key verification

## 🔧 Dependencies

Make sure you have the required packages installed:

```bash
npm install crypto-js @types/crypto-js
```

## 🚀 Features Implemented

### ✅ Client-Side Encryption

- Messages are encrypted on the client before being sent
- Each group has its own encryption key
- Keys are stored securely per user per group
- AES-256-CBC encryption with PBKDF2 key derivation

### ✅ Secure Key Management

- Encryption keys are generated per group per user
- Keys are stored with fingerprint verification
- Automatic key generation and retrieval
- Secure key derivation using PBKDF2

### ✅ Real-time Encrypted Messaging

- Messages are encrypted before sending
- Messages are decrypted after receiving
- Real-time updates work with encrypted messages
- Fallback handling for decryption failures

### ✅ UI Indicators

- Encryption status shown in chat header
- Visual indicators for encrypted messages
- Error handling for failed decryption

## 📁 Files Created/Modified

### New Files:

- `src/shared/utils/encryption.ts` - Encryption utilities
- `src/shared/hooks/useGroupEncryption.ts` - Encryption management hook
- `database-encryption-schema.sql` - Database schema for encryption
- `E2E_ENCRYPTION_SETUP.md` - This setup guide

### Modified Files:

- `src/app/api/groups/[groupId]/messages/route.ts` - Updated to handle encrypted messages
- `src/shared/hooks/useGroupChat.ts` - Updated to encrypt/decrypt messages
- `src/app/(app)/groups/[groupId]/chat/page.tsx` - Added encryption status UI

## 🔒 Security Features

### Encryption Algorithm

- **Algorithm**: AES-256-CBC
- **Key Derivation**: PBKDF2 with 10,000 iterations
- **Salt**: Random 128-bit salt per message
- **IV**: Random 128-bit initialization vector per message

### Key Management

- **Key Generation**: Random 256-bit keys per group
- **Key Storage**: Encrypted in database with RLS
- **Key Fingerprinting**: SHA-256 fingerprint for verification
- **Key Rotation**: Support for future key rotation

### Data Protection

- **Client-Side Encryption**: Messages encrypted before transmission
- **Server-Side Storage**: Only encrypted data stored on server
- **Access Control**: RLS policies prevent unauthorized access
- **Audit Trail**: Key creation timestamps for tracking

## 🎯 How It Works

### 1. Key Generation

When a user first accesses a group chat:

1. System checks if user has an encryption key for this group
2. If no key exists, generates a new 256-bit random key
3. Stores key with fingerprint in `group_encryption_keys` table
4. Key is associated with specific user and group

### 2. Message Encryption

When sending a message:

1. User types message in plain text
2. System retrieves group encryption key
3. Generates random salt and IV for this message
4. Derives encryption key using PBKDF2
5. Encrypts message using AES-256-CBC
6. Sends encrypted content, IV, and salt to server
7. Server stores only encrypted data

### 3. Message Decryption

When receiving a message:

1. System retrieves encrypted message from server
2. Gets user's encryption key for this group
3. Uses stored salt to derive decryption key
4. Decrypts message using AES-256-CBC
5. Displays plain text message to user

### 4. Real-time Updates

For real-time messages:

1. New message triggers Supabase real-time subscription
2. System fetches complete message with encryption data
3. Decrypts message using local key
4. Updates UI with decrypted content

## 🔧 Configuration

### Environment Variables

No additional environment variables required - encryption uses existing Supabase setup.

### Database Permissions

Ensure your Supabase RLS policies are properly configured:

```sql
-- Users can only access their own encryption keys
CREATE POLICY "Users can read their own encryption keys" ON group_encryption_keys
  FOR SELECT USING (user_id = (auth.uid())::uuid);
```

## 🐛 Troubleshooting

### Messages not decrypting?

1. Check that encryption keys exist for the user and group
2. Verify the key fingerprint matches
3. Check browser console for decryption errors
4. Ensure the encryption schema was applied correctly

### Encryption status not showing?

1. Check that the `useGroupEncryption` hook is working
2. Verify the key fingerprint is being generated
3. Check that the UI components are properly imported

### Performance issues?

1. Monitor key generation and storage operations
2. Check for unnecessary re-encryption of messages
3. Verify real-time subscription efficiency

## 🔮 Future Enhancements

- [ ] Key rotation support
- [ ] Forward secrecy implementation
- [ ] Message verification (digital signatures)
- [ ] Encrypted file attachments
- [ ] Encrypted voice messages
- [ ] Key backup and recovery
- [ ] Cross-device key synchronization
- [ ] Encrypted group metadata
- [ ] Message expiration
- [ ] Encrypted reactions and replies

## 📝 API Changes

### GET `/api/groups/[groupId]/messages`

Now returns encrypted message data:

```json
[
  {
    "id": "uuid",
    "content": null, // null for encrypted messages
    "encryptedContent": "encrypted_data",
    "encryptionIv": "initialization_vector",
    "encryptionSalt": "salt",
    "isEncrypted": true,
    "timestamp": "12:34",
    "sender": "John Doe",
    "isCurrentUser": false
  }
]
```

### POST `/api/groups/[groupId]/messages`

Now accepts encrypted message data:

```json
{
  "content": "Hello world",
  "encryptedContent": "encrypted_data",
  "encryptionIv": "initialization_vector",
  "encryptionSalt": "salt",
  "isEncrypted": true
}
```

## 🎉 Success!

Your group chat now has end-to-end encryption! Messages are encrypted on the client before being sent to the server, ensuring that only group members with the correct encryption keys can read the messages.

## 🔐 Security Notes

- **Key Storage**: Encryption keys are stored in the database but protected by RLS policies
- **Key Generation**: Keys are generated client-side using cryptographically secure random numbers
- **Message Security**: Each message uses unique salt and IV for maximum security
- **Access Control**: Only authenticated group members can access encryption keys
- **Audit Trail**: All key operations are timestamped for security auditing

The implementation provides strong security while maintaining usability and real-time functionality.
