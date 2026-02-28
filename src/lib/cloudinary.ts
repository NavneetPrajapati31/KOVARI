import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  url: string;
  public_id: string;
  secure_url: string;
  format: string;
  resource_type: string;
  bytes: number;
  width?: number;
  height?: number;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  resource_type?: "image" | "video" | "auto";
  transformation?: string;
  public_id?: string;
}

/**
 * Upload a file to Cloudinary
 */
export const uploadToCloudinary = async (
  file: Buffer | string,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> => {
  try {
    const uploadOptions = {
      folder: options.folder || "kovari-groups",
      resource_type: options.resource_type || "auto",
      transformation: options.transformation,
      public_id: options.public_id,
    };

    let result;
    if (typeof file === "string") {
      // Upload from URL
      result = await cloudinary.uploader.upload(file, uploadOptions);
    } else {
      // Upload from buffer (fix: wrap in Promise)
      result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(file);
      });
    }
    const uploadResult = result as any;
    return {
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      secure_url: uploadResult.secure_url,
      format: uploadResult.format,
      resource_type: uploadResult.resource_type,
      bytes: uploadResult.bytes,
      width: uploadResult.width,
      height: uploadResult.height,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload to Cloudinary");
  }
};

/**
 * Delete a file from Cloudinary
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new Error("Failed to delete from Cloudinary");
  }
};

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
  if (!url.includes("cloudinary.com")) {
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

export default cloudinary;
