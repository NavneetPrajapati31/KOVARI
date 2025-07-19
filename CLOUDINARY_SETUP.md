# Cloudinary Setup Guide

This guide will help you set up Cloudinary for storing group chat media files instead of local storage.

## Why Cloudinary?

- **Better Performance**: Global CDN for faster loading
- **Image Optimization**: Automatic resizing, compression, and format conversion
- **Video Support**: Optimized video delivery
- **Cost Effective**: Generous free tier (25GB storage, 25GB bandwidth/month)
- **Easy Integration**: Simple API and excellent Next.js support

## Setup Steps

### 1. Create Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com/) and sign up for a free account
2. Verify your email address
3. Get your credentials from the Dashboard:
   - Cloud Name
   - API Key
   - API Secret

### 2. Environment Variables

Add these to your `.env.local` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Database Migration

Run this SQL in your Supabase database:

```sql
-- Add cloudinary_public_id column to group_media table
ALTER TABLE group_media 
ADD COLUMN IF NOT EXISTS cloudinary_public_id TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_group_media_cloudinary_public_id 
ON group_media(cloudinary_public_id);

-- Add comment to document the column
COMMENT ON COLUMN group_media.cloudinary_public_id IS 'Cloudinary public ID for file deletion';
```

### 4. Install Dependencies

```bash
npm install cloudinary
```

### 5. Migration (Optional)

If you have existing local media files, run the migration script:

```bash
# Create a migration script
npx tsx src/lib/migrate-local-to-cloudinary.ts
```

## Features

### Automatic Image Optimization

Cloudinary automatically optimizes images based on device and browser:

```typescript
// Get optimized image URL
const optimizedUrl = getOptimizedUrl(imageUrl, {
  width: 800,
  height: 600,
  quality: 80,
  format: 'webp'
});
```

### Video Support

Videos are automatically transcoded to multiple formats for better compatibility.

### Secure URLs

All URLs use HTTPS and include security transformations.

## API Endpoints

### Upload Media
```
POST /api/groups/[groupId]/media
```

### Delete Media
```
DELETE /api/groups/[groupId]/media/[mediaId]
```

### Get Media List
```
GET /api/groups/[groupId]/media
```

## File Structure

```
src/lib/
├── cloudinary.ts          # Cloudinary configuration and utilities
├── migrate-local-to-cloudinary.ts  # Migration script
└── migrations/
    └── add-cloudinary-column.sql   # Database migration
```

## Benefits Over Local Storage

1. **Scalability**: No server storage limits
2. **Performance**: Global CDN with edge locations
3. **Reliability**: 99.9% uptime SLA
4. **Cost**: Pay only for what you use
5. **Features**: Automatic optimization, transformations, analytics

## Monitoring

Monitor your Cloudinary usage in the Dashboard:
- Storage used
- Bandwidth consumed
- Transformations performed
- Error rates

## Troubleshooting

### Common Issues

1. **Upload Fails**: Check API credentials and network connectivity
2. **Images Not Loading**: Verify Next.js image configuration includes `res.cloudinary.com`
3. **Migration Errors**: Ensure local files exist before migration

### Debug Mode

Enable debug logging by adding to your environment:

```env
CLOUDINARY_DEBUG=true
```

## Cost Optimization

1. **Use WebP format** for better compression
2. **Implement lazy loading** for media galleries
3. **Set appropriate quality** based on use case
4. **Use responsive images** with different sizes

## Security

- API keys are stored securely in environment variables
- All uploads are validated for file type and size
- Public IDs are stored for secure deletion
- URLs are signed for additional security if needed

## Next Steps

1. Test the upload functionality
2. Monitor usage in Cloudinary dashboard
3. Consider implementing image transformations
4. Set up webhook notifications for upload events 