// src/app/api/flags/evidence/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";
import * as Sentry from "@sentry/nextjs";

/**
 * POST /api/flags/evidence
 * Upload evidence file for a flag report
 */
export async function POST(req: NextRequest) {
  try {
    // Validate authentication
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only images are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(buffer, {
      folder: "kovari-evidence/temp",
      resource_type: "image",
    });

    // Log to Sentry
    Sentry.captureMessage("Evidence uploaded", {
      level: "info",
      tags: {
        scope: "public-api",
        route: "POST /api/flags/evidence",
      },
      extra: {
        fileSize: file.size,
        fileType: file.type,
        publicId: uploadResult.public_id,
      },
    });

    return NextResponse.json({
      success: true,
      evidenceUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error) {
    console.error("[EVIDENCE_UPLOAD_ERROR]", error);
    Sentry.captureException(error, {
      tags: {
        scope: "public-api",
        route: "POST /api/flags/evidence",
      },
    });
    return NextResponse.json(
      { error: "Failed to upload evidence" },
      { status: 500 }
    );
  }
}
