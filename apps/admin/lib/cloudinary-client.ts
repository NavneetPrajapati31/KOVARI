/**
 * Pure client-safe Cloudinary URL formatters.
 * These do NOT import the Node.js `cloudinary` SDK to prevent Webpack `fs` module errors in Client Components.
 */

/**
 * Get optimized URL for an image/video
 */
export const getOptimizedUrl = (
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number | string;
    format?: string;
    crop?: string;
    gravity?: string;
  } = {}
): string => {
  if (!url || !url.includes("cloudinary.com")) {
    return url; // Return original URL if not from Cloudinary
  }

  // CRITICAL FIX: Do not mutate signed URLs!
  // If a URL has a signature (e.g. `s--xxxxxx--`), injecting unsigned transformations 
  // into the URL breaks the cryptographic signature, causing a 400 Bad Request.
  if (url.includes("/s--")) {
    return url;
  }

  const transformations = [];

  // High-fidelity defaults
  const finalOptions = {
    format: "auto",
    quality: "auto", // Uses Cloudinary's clever 'q_auto' which drops size without visible quality loss
    crop: "limit",   // 'c_limit' prevents upscaling of small images, preserving visual quality
    ...options
  };

  if (finalOptions.crop) transformations.push(`c_${finalOptions.crop}`);
  if (finalOptions.width) transformations.push(`w_${finalOptions.width}`);
  if (finalOptions.height) transformations.push(`h_${finalOptions.height}`);
  if (finalOptions.gravity) transformations.push(`g_${finalOptions.gravity}`);
  if (finalOptions.quality) transformations.push(`q_${finalOptions.quality}`);
  if (finalOptions.format) transformations.push(`f_${finalOptions.format}`);

  if (transformations.length === 0) {
    return url;
  }

  // Insert transformations into the URL
  const urlParts = url.split("/");
  const uploadIndex = urlParts.findIndex((part) => part === "upload");

  if (uploadIndex !== -1) {
    urlParts.splice(uploadIndex + 1, 0, transformations.join(","));
    return urlParts.join("/");
  }

  return url;
};

/**
 * Strategy: Tiny Thumbnails (e.g. Avatars, List icons)
 * Forces a small square, smart-cropping to the most interesting subject (faces)
 */
export const getThumbnailUrl = (url: string, size = 150): string => {
  return getOptimizedUrl(url, {
    width: size,
    height: size,
    crop: "fill",
    gravity: "auto",
  });
};

/**
 * Strategy: Feed / Grid Images (e.g. Posts, Destination cards)
 * Bound width to standard mobile/desktop feed sizes. No upscaling.
 */
export const getFeedImageUrl = (url: string): string => {
  return getOptimizedUrl(url, {
    width: 1080,
    crop: "limit",
    quality: "auto",
  });
};

/**
 * Strategy: Full Screen / Detail View (e.g. Chat media overlay, profile cover)
 * High-res bounding box, prioritizes best quality.
 */
export const getFullImageUrl = (url: string): string => {
  return getOptimizedUrl(url, {
    width: 2048,
    crop: "limit",
    quality: "auto:best",
  });
};

/**
 * Extract public ID from Cloudinary URL
 */
export const getPublicIdFromUrl = (url: string): string | null => {
  if (!url || !url.includes("cloudinary.com")) {
    return null;
  }

  try {
    const urlParts = url.split("/");
    const uploadIndex = urlParts.findIndex((part) => part === "upload");

    if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
      // Skip the transformation part and get the public ID
      const publicIdWithExtension = urlParts[uploadIndex + 2];
      const lastDotIndex = publicIdWithExtension.lastIndexOf(".");

      if (lastDotIndex !== -1) {
        return publicIdWithExtension.substring(0, lastDotIndex);
      }
    }
  } catch (error) {
    console.error("Error extracting public ID:", error);
  }

  return null;
};
