# Deleted Users and Removed Members Chat Verification

This document explains the changes made to ensure that messages from deleted users and removed group members remain visible in the group chat.

## 🎯 Problem Statement

The original implementation had two issues:

1. **Missing `deleted` field**: The queries didn't include the `deleted` field from the `profiles` table, so deleted users would show as "Unknown User"
2. **No handling for removed users**: Messages from users who were removed from the group would still be visible, but the sender information wasn't properly handled

## ✅ Changes Made

### 1. Updated Message Fetching API (`/api/groups/[groupId]/messages/route.ts`)

**Before:**

```sql
profiles(
  name,
  username,
  profile_photo
)
```

**After:**

```sql
profiles(
  name,
  username,
  profile_photo,
  deleted
)
```

**Message formatting logic updated:**

```typescript
const profile = message.users?.profiles;
const isDeleted = profile?.deleted === true;

return {
  // ... other fields
  sender: isDeleted ? "Deleted User" : profile?.name || "Unknown User",
  senderUsername: isDeleted ? undefined : profile?.username,
  avatar: isDeleted ? undefined : profile?.profile_photo,
  // ... other fields
};
```

### 2. Updated Real-time Message Handling (`useGroupChat.ts`)

**Before:**

```sql
profiles(
  name,
  username,
  profile_photo
)
```

**After:**

```sql
profiles(
  name,
  username,
  profile_photo,
  deleted
)
```

**Real-time message formatting updated:**

```typescript
sender: (() => {
  const profile = (messageData.users as any)?.profiles;
  const isDeleted = profile?.deleted === true;
  return isDeleted ? "Deleted User" : (profile?.name || "Unknown User");
})(),
senderUsername: (() => {
  const profile = (messageData.users as any)?.profiles;
  const isDeleted = profile?.deleted === true;
  return isDeleted ? undefined : profile?.username;
})(),
avatar: (() => {
  const profile = (messageData.users as any)?.profiles;
  const isDeleted = profile?.deleted === true;
  return isDeleted ? undefined : profile?.profile_photo;
})(),
```

### 3. Updated Group Members API (`/api/groups/[groupId]/members/route.ts`)

**Before:**

```sql
profiles(
  name,
  username,
  profile_photo
)
```

**After:**

```sql
profiles(
  name,
  username,
  profile_photo,
  deleted
)
```

**Member formatting logic updated:**

```typescript
const profile = member.users?.profiles;
const isDeleted = profile?.deleted === true;

return {
  // ... other fields
  name: isDeleted ? "Deleted User" : profile?.name || "Unknown User",
  username: isDeleted ? undefined : profile?.username,
  avatar: isDeleted ? undefined : profile?.profile_photo,
  // ... other fields
};
```

## 🔍 Verification Steps

### Step 1: Test with Existing Data

1. **Navigate to a group chat** that has messages from users who might have been deleted
2. **Check the chat interface** - messages from deleted users should show "Deleted User" as the sender
3. **Check the members list** - deleted users should appear as "Deleted User"

### Step 2: Run Automated Tests

1. **Load the test script** in your browser console:

   ```javascript
   // Copy and paste the contents of test-deleted-users-chat.js
   ```

2. **Run all tests**:

   ```javascript
   runAllTests();
   ```

3. **Or run individual tests**:
   ```javascript
   testDeletedUserMessages(); // Test message visibility
   testDeletedUserMembers(); // Test member list handling
   testRemovedUserMessages(); // Test removed user messages
   testRealtimeMessageHandling(); // Test real-time functionality
   ```

### Step 3: Manual Testing Scenarios

#### Scenario 1: Deleted User Messages

1. **Create a test group** with multiple users
2. **Have users send messages** in the group chat
3. **Delete a user's account** (set `deleted = true` in the `profiles` table)
4. **Verify** that their messages still appear with "Deleted User" as sender

#### Scenario 2: Removed User Messages

1. **Create a test group** with multiple users
2. **Have users send messages** in the group chat
3. **Remove a user from the group** (delete from `group_memberships`)
4. **Verify** that their messages still appear in the chat history

#### Scenario 3: Real-time Handling

1. **Open the group chat** in multiple browser tabs
2. **Send messages** from different users
3. **Delete a user account** while chat is active
4. **Verify** that new messages from the deleted user show "Deleted User"

## 📊 Expected Behavior

### ✅ Messages from Deleted Users

- **Sender name**: "Deleted User"
- **Username**: `undefined` (not displayed)
- **Avatar**: `undefined` (not displayed)
- **Message content**: Still visible and decryptable
- **Timestamp**: Preserved

### ✅ Messages from Removed Users

- **Sender name**: Original name or "Unknown User"
- **Username**: Original username or `undefined`
- **Avatar**: Original avatar or `undefined`
- **Message content**: Still visible and decryptable
- **Timestamp**: Preserved

### ✅ Real-time Updates

- **New messages** from deleted users show "Deleted User"
- **Existing messages** remain unchanged
- **Decryption** still works for encrypted messages
- **UI updates** properly reflect deleted user status

## 🐛 Troubleshooting

### Issue: Messages still show "Unknown User"

**Solution**: Check that the `deleted` field is properly set to `true` in the `profiles` table for the user.

### Issue: Real-time messages not updating

**Solution**: Verify that the Supabase real-time subscription is working and the `deleted` field is included in the query.

### Issue: Members list not showing "Deleted User"

**Solution**: Ensure the group members API is updated and the `deleted` field is included in the query.

### Issue: Test script not working

**Solution**:

1. Make sure you're logged into the application
2. Navigate to a group page or provide a valid group ID
3. Check browser console for any errors
4. Verify that the API endpoints are accessible

## 🔧 Database Verification

To manually verify the database state:

```sql
-- Check for deleted users
SELECT
  u.id,
  p.name,
  p.username,
  p.deleted
FROM users u
JOIN profiles p ON u.id = p.user_id
WHERE p.deleted = true;

-- Check messages from deleted users
SELECT
  gm.id,
  gm.user_id,
  p.name,
  p.deleted,
  gm.created_at
FROM group_messages gm
JOIN users u ON gm.user_id = u.id
JOIN profiles p ON u.id = p.user_id
WHERE p.deleted = true;
```

## ✅ Success Criteria

The implementation is successful when:

1. ✅ Messages from deleted users show "Deleted User" as sender
2. ✅ Messages from removed users remain visible in chat history
3. ✅ Real-time updates handle deleted users properly
4. ✅ Group members list shows "Deleted User" for deleted members
5. ✅ Encrypted messages from deleted users can still be decrypted
6. ✅ No errors occur when accessing chat with deleted/removed users

## 🎉 Summary

The changes ensure that:

- **Chat history is preserved** regardless of user account status
- **Deleted users are properly identified** with "Deleted User" label
- **Removed users' messages remain visible** in the chat
- **Real-time functionality works** with deleted users
- **UI gracefully handles** missing user information
- **Encryption/decryption continues to work** for all messages

This provides a robust chat experience that maintains message history while clearly indicating when users have been deleted from the system.
