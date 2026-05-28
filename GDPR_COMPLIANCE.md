# KOVARI GDPR Compliance & Right to Erasure

As a social travel platform serving international users, KOVARI complies with the General Data Protection Regulation (GDPR), specifically Article 17 (Right to Erasure / Right to be Forgotten).

## Data We Collect
- **Profile Data:** Name, username, email, phone number, bio, and profile photos.
- **Interactions:** Direct messages, group messages, matches, travel interests, and post itineraries.
- **Activity Data:** Device sessions, notifications, and application interaction logs.

## Storage
- Primary data is stored securely in our Supabase (PostgreSQL) database.
- Profile photos and rich media are stored in our Cloudinary media buckets.
- Authentication records are managed via Clerk.

## Deletion Request Flow
Users can initiate a complete data deletion directly from the application:
1. Navigate to **Settings > Account**.
2. Select **Delete Account**.
3. Confirm the permanent deletion by typing `DELETE` in the modal prompt.

## Backend Deletion Process (Cascade)
Upon receiving a deletion request, the `/api/settings/delete-account` route securely:
1. **Verifies Identity:** Authenticates the session.
2. **Purges Relational Data:** Executes a full hard-delete cascade in the correct order to respect foreign key constraints, wiping all messages, matches, group memberships, and profiles.
3. **Purges Media:** Retrieves the `public_id` of uploaded media and destroys the assets in Cloudinary.
4. **Purges Auth Records:** Invokes the Clerk API to permanently delete the identity record.

This process is permanent and irreversible. All personal identifiers are removed from active databases. No backups retain data longer than the standard 30-day retention cycle.
