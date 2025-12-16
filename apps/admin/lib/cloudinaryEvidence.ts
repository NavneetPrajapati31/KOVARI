// apps/admin/lib/cloudinaryEvidence.ts
import { v2 as cloudinary } from 'cloudinary';
import { uploadToCloudinary, getOptimizedUrl } from '@/admin-lib/cloudinary';

// Configure Cloudinary (uses same config as main app)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface EvidenceUploadResult {
  url: string;
  secure_url: string;
  public_id: string;
  thumbnail_url: string; // Optimized thumbnail URL
  format: string;
  bytes: number;
  width?: number;
  height?: number;
}

/**
 * Upload evidence file (screenshot/image/document) to Cloudinary
 * Stores in dedicated folder for admin evidence
 */
export async function uploadEvidence(
  file: Buffer | string,
  options: {
    flagId?: string;
    reporterId?: string;
    fileName?: string;
  } = {},
): Promise<EvidenceUploadResult> {
  const folder = `kovari-evidence/${options.flagId || 'temp'}`;
  const publicId = options.fileName
    ? `${folder}/${options.fileName}`
    : undefined;

  const uploadResult = await uploadToCloudinary(file, {
    folder,
    resource_type: 'auto', // Supports images, PDFs, etc.
    public_id: publicId,
  });

  // Generate thumbnail URL (optimized for admin UI)
  const thumbnailUrl = getOptimizedUrl(uploadResult.secure_url, {
    width: 300,
    height: 300,
    quality: 80,
    format: 'webp',
  });

  return {
    url: uploadResult.url,
    secure_url: uploadResult.secure_url,
    public_id: uploadResult.public_id,
    thumbnail_url: thumbnailUrl,
    format: uploadResult.format,
    bytes: uploadResult.bytes,
    width: uploadResult.width,
    height: uploadResult.height,
  };
}

/**
 * Generate signed URL for evidence (expires after specified time)
 * Useful for secure, time-limited access to evidence
 */
export function generateSignedEvidenceUrl(
  publicId: string,
  options: {
    expiresIn?: number; // seconds (default: 1 hour)
    width?: number;
    height?: number;
    quality?: number;
    format?: string; // file format (jpg, png, pdf, etc.)
    type?: 'upload' | 'private' | 'authenticated'; // Default to 'upload' (public)
  } = {},
): string {
  const expiresIn = options.expiresIn || 3600; // 1 hour default
  const format = options.format || 'auto'; // default to auto-detect
  const type = options.type || 'upload'; // Default to public uploads

  // Build transformation array
  const transformations: Array<Record<string, string | number>> = [];
  if (options.width) transformations.push({ width: options.width });
  if (options.height) transformations.push({ height: options.height });
  if (options.quality) transformations.push({ quality: options.quality });

  // For public images (type: 'upload'), we don't need signed URLs
  // Just return optimized URL
  if (type === 'upload') {
    const baseUrl = cloudinary.url(publicId, {
      resource_type: 'auto',
      format: format === 'auto' ? undefined : format,
      ...(transformations.length > 0 && { transformation: transformations }),
    });
    return baseUrl;
  }

  // For private/authenticated images, use signed URLs
  return cloudinary.url(publicId, {
    resource_type: 'auto',
    type: type,
    format: format === 'auto' ? undefined : format,
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    ...(transformations.length > 0 && { transformation: transformations }),
  });
}

/**
 * Generate signed thumbnail URL for evidence (for admin UI)
 * Smaller, optimized version for quick preview
 */
export function generateSignedThumbnailUrl(
  publicId: string,
  options: {
    expiresIn?: number; // seconds (default: 1 hour)
    size?: number; // thumbnail size (default: 300px)
    format?: string; // file format (default: webp)
    type?: 'upload' | 'private' | 'authenticated'; // Default to 'upload' (public)
  } = {},
): string {
  const size = options.size || 300;
  const expiresIn = options.expiresIn || 3600;
  const format = options.format || 'webp';
  const type = options.type || 'upload'; // Default to public uploads

  // For public images (type: 'upload'), we don't need signed URLs
  // Just return optimized URL with transformations
  if (type === 'upload') {
    return cloudinary.url(publicId, {
      resource_type: 'image',
      format: format,
      transformation: [
        {
          width: size,
          height: size,
          crop: 'fill',
          quality: 80,
          format: 'webp',
        },
      ],
    });
  }

  // For private/authenticated images, use signed URLs
  return cloudinary.url(publicId, {
    resource_type: 'image',
    type: type,
    format: format,
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    transformation: [
      { width: size, height: size, crop: 'fill', quality: 80, format: 'webp' },
    ],
  });
}

/**
 * Extract public ID from Cloudinary URL
 * Helper to get public_id from stored evidence_url
 * Handles URLs with version numbers (v1234567890/)
 */
export function getPublicIdFromEvidenceUrl(url: string): string | null {
  if (!url || !url.includes('cloudinary.com')) {
    return null;
  }

  try {
    // Extract public_id from Cloudinary URL
    // Format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{v{version}/}{transformations/}{public_id}.{format}
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex((part) => part === 'upload');

    if (uploadIndex === -1 || uploadIndex + 1 >= urlParts.length) {
      return null;
    }

    // Find the part that contains the file extension (has a dot)
    // Skip version numbers (v1234567890) and transformations
    const pathParts: string[] = [];
    for (let i = uploadIndex + 1; i < urlParts.length; i++) {
      const part = urlParts[i];

      // Skip version numbers (start with 'v' followed by digits)
      if (/^v\d+$/.test(part)) {
        continue;
      }

      const dotIndex = part.lastIndexOf('.');
      if (dotIndex !== -1) {
        // Found the file part with extension
        const publicId = part.substring(0, dotIndex);
        // Reconstruct full path
        if (pathParts.length > 0) {
          return pathParts.join('/') + '/' + publicId;
        }
        return publicId;
      }

      // This is a folder/path segment
      pathParts.push(part);
    }
  } catch (error) {
    console.error('Error extracting public ID from evidence URL:', error);
  }

  return null;
}

/**
 * Delete evidence from Cloudinary
 * Use when flag is dismissed or evidence is no longer needed
 */
export async function deleteEvidence(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image',
): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.error('Error deleting evidence from Cloudinary:', error);
    throw new Error('Failed to delete evidence');
  }
}

/**
 * Get optimized evidence URL for display
 * Automatically generates appropriate size/quality based on context
 */
export function getEvidenceDisplayUrl(
  evidenceUrl: string,
  context: 'thumbnail' | 'preview' | 'full' = 'preview',
): string {
  if (!evidenceUrl || !evidenceUrl.includes('cloudinary.com')) {
    return evidenceUrl; // Return original if not Cloudinary
  }

  const options = {
    thumbnail: { width: 150, height: 150, quality: 70, format: 'webp' },
    preview: { width: 800, height: 800, quality: 85, format: 'webp' },
    full: { quality: 90 },
  };

  return getOptimizedUrl(evidenceUrl, options[context]);
}
