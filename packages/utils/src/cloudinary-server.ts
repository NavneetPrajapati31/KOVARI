import { v2 as cloudinary } from "cloudinary";
import { getOptimizedUrl, getThumbnailUrl, getFeedImageUrl, getFullImageUrl, getPublicIdFromUrl } from "./cloudinary-client";

// Configure Cloudinary only on the server
if (typeof window === "undefined" && process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

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
      result = await cloudinary.uploader.upload(file, uploadOptions);
    } else {
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

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new Error("Failed to delete from Cloudinary");
  }
};

export {
  getOptimizedUrl,
  getThumbnailUrl,
  getFeedImageUrl,
  getFullImageUrl,
  getPublicIdFromUrl
};

export default cloudinary;
