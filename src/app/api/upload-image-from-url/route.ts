import { NextRequest, NextResponse } from "next/server";
import { UTApi, UTFile } from "uploadthing/server";

const utapi = new UTApi();

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Download the image
    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: 400 }
      );
    }

    // Check content-type
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "URL does not point to an image file" },
        { status: 400 }
      );
    }

    // Determine extension from content-type
    const ext = contentType.split("/")[1]?.split(";")[0] || "jpg";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Use UTFile for server-side upload
    const file = new UTFile([buffer], `imported-image.${ext}`, {
      type: contentType,
    });
    const uploadRes = await utapi.uploadFiles(file);
    const uploadedUrl = Array.isArray(uploadRes)
      ? uploadRes[0]?.data?.url
      : uploadRes?.data?.url;
    if (!uploadedUrl) {
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: uploadedUrl });
  } catch (error) {
    console.error("Image import error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
