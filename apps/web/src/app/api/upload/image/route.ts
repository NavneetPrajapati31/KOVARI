import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/get-user";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary server-side
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "kovari-uploads";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Read file into buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // STRIP EXIF DATA AND NORMALIZE IMAGE USING SHARP
    // .rotate() reads EXIF orientation and applies it, then withMetadata() is omitted so EXIF is stripped
    const processedBuffer = await sharp(buffer)
      .rotate() 
      .toBuffer();

    // Upload to Cloudinary using a Promise wrapper
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: "image",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      
      // Write the processed buffer to the stream
      uploadStream.end(processedBuffer);
    });

    return NextResponse.json(uploadResult);
  } catch (error) {
    console.error("Secure Image Upload Error:", error);
    return NextResponse.json(
      { error: "Failed to upload and process image" },
      { status: 500 }
    );
  }
}
