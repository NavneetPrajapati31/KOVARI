# Phase 1 — Storage Recommendation: Cloudinary

## ✅ Recommendation: Use Cloudinary

### Why Cloudinary?

1. **Already Integrated** ✅
   - Cloudinary is the primary media storage solution in your codebase
   - Used for group media, direct chat media, profile posts
   - Full implementation with upload/delete/optimization functions
   - Already configured in Next.js (`next.config.mjs`)

2. **Better for Evidence Storage** ✅
   - Server-side upload support (required for admin evidence)
   - Signed URL support for secure, time-limited access
   - Automatic thumbnail generation
   - Image optimization and transformations
   - Supports images, PDFs, and documents

3. **Production Ready** ✅
   - Mature implementation with error handling
   - Migration scripts already exist
   - Setup documentation available (`CLOUDINARY_SETUP.md`)
   - Environment variables already configured

### UploadThing Comparison

| Feature | Cloudinary | UploadThing |
|---------|-----------|------------|
| **Current Usage** | Primary (group media, chat) | Secondary (profile images only) |
| **Server-side Upload** | ✅ Full support | ⚠️ Limited |
| **Signed URLs** | ✅ Native support | ❌ Not available |
| **Thumbnails** | ✅ Automatic | ⚠️ Manual |
| **Evidence Folder** | ✅ Easy organization | ⚠️ Less flexible |
| **Admin Use Case** | ✅ Perfect fit | ⚠️ Client-focused |

---

## Implementation

### 1. Evidence Upload Helper Created

**File:** `apps/admin/lib/cloudinaryEvidence.ts`

**Functions:**
- `uploadEvidence()` - Upload evidence files to Cloudinary
- `generateSignedEvidenceUrl()` - Generate secure, time-limited URLs
- `generateSignedThumbnailUrl()` - Generate optimized thumbnails
- `getEvidenceDisplayUrl()` - Get optimized URLs for display
- `deleteEvidence()` - Delete evidence when no longer needed
- `getPublicIdFromEvidenceUrl()` - Extract public_id from stored URL

### 2. Folder Structure

Evidence files will be stored in:
```
kovari-evidence/
  ├── {flagId}/
  │   ├── evidence-1.jpg
  │   ├── evidence-2.png
  │   └── screenshot.pdf
```

### 3. Database Schema

The `user_flags` table already has:
- `evidence_url` (text) - Stores Cloudinary URL
- ✅ No changes needed

**Optional Enhancement:**
Consider adding `evidence_public_id` column for easier deletion:
```sql
ALTER TABLE user_flags 
ADD COLUMN IF NOT EXISTS evidence_public_id TEXT;

CREATE INDEX IF NOT EXISTS idx_user_flags_evidence_public_id 
ON user_flags(evidence_public_id);
```

---

## Usage Examples

### Upload Evidence (API Route)

```typescript
import { uploadEvidence } from "@/admin-lib/cloudinaryEvidence";

// In your flag creation/update API route
const formData = await req.formData();
const file = formData.get("evidence") as File;
const buffer = Buffer.from(await file.arrayBuffer());

const evidence = await uploadEvidence(buffer, {
  flagId: flagId,
  reporterId: reporterId,
  fileName: `evidence-${Date.now()}.${file.name.split('.').pop()}`,
});

// Store in database
await supabaseAdmin
  .from("user_flags")
  .update({ 
    evidence_url: evidence.secure_url,
    evidence_public_id: evidence.public_id, // if column exists
  })
  .eq("id", flagId);
```

### Generate Signed Thumbnail (For Admin UI)

```typescript
import { generateSignedThumbnailUrl, getPublicIdFromEvidenceUrl } from "@/admin-lib/cloudinaryEvidence";

// In your flags listing API
const flags = await getFlags();

const flagsWithThumbnails = flags.map(flag => {
  if (!flag.evidence_url) return flag;
  
  const publicId = getPublicIdFromEvidenceUrl(flag.evidence_url);
  if (!publicId) return flag;
  
  return {
    ...flag,
    evidence_thumbnail: generateSignedThumbnailUrl(publicId, {
      size: 150,
      expiresIn: 3600, // 1 hour
    }),
  };
});
```

### Display Evidence in UI

```typescript
import { getEvidenceDisplayUrl } from "@/admin-lib/cloudinaryEvidence";

// In your React component
<img 
  src={getEvidenceDisplayUrl(flag.evidence_url, "thumbnail")}
  alt="Evidence thumbnail"
  className="w-20 h-20 object-cover rounded"
/>
```

---

## Environment Variables

Already configured (no changes needed):
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Security Considerations

1. **Signed URLs**: Use for sensitive evidence (expires after 1 hour)
2. **Folder Organization**: Separate folder per flag for easy management
3. **Access Control**: Only admins can upload/view evidence
4. **Deletion**: Clean up evidence when flags are dismissed/resolved

---

## Next Steps

1. ✅ Evidence upload helper created (`cloudinaryEvidence.ts`)
2. ⏳ Create API route for evidence upload (`/api/admin/flags/[id]/evidence`)
3. ⏳ Update flags listing to include thumbnails
4. ⏳ Add evidence display in flag detail modal
5. ⏳ Optional: Add `evidence_public_id` column to database

---

## Cost Considerations

**Cloudinary Free Tier:**
- 25GB storage
- 25GB bandwidth/month
- Unlimited transformations

**For Evidence Storage:**
- Evidence files are typically small (screenshots: 100-500KB)
- Thumbnails are cached and optimized
- Estimated: ~1000 flags/month = ~500MB storage

✅ Well within free tier limits

---

## Summary

✅ **Use Cloudinary** - It's already your primary storage solution, has all the features needed for evidence storage, and is production-ready.

The helper functions in `cloudinaryEvidence.ts` provide everything needed for:
- Uploading evidence
- Generating signed URLs
- Creating thumbnails
- Optimizing display URLs
- Deleting evidence

Ready to proceed with Phase 1 implementation! 🚀
