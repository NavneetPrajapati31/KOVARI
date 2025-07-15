import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { uploadToCloudinary } from "@/lib/cloudinary";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export async function POST(request: NextRequest) {
  try {
    // Parse multipart form
    const formData = await request.formData();
    const file = formData.get("file");
    const senderId = formData.get("uploaded_by");
    const receiverId = formData.get("receiver_id");
    if (!senderId || !receiverId) {
      return NextResponse.json(
        { error: "Missing sender or receiver id" },
        { status: 400 }
      );
    }
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    const type = file.type.startsWith("video")
      ? "video"
      : file.type.startsWith("image")
        ? "image"
        : null;
    if (!type) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Upload to Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await uploadToCloudinary(buffer, {
      folder: `kovari-direct/${senderId}-${receiverId}`,
      resource_type: type === "video" ? "video" : "image",
      public_id: `${uuidv4()}`,
    });

    const url = uploadResult.secure_url;

    return NextResponse.json(
      { url, type, cloudinary_public_id: uploadResult.public_id },
      { status: 201 }
    );
  } catch (err) {
    console.error("[DIRECT MEDIA][POST] Unexpected error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
