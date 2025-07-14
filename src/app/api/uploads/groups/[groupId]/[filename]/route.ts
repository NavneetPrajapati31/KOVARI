import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

function getParamsFromUrl(request: NextRequest) {
  // /api/uploads/groups/[groupId]/[filename]
  const match = request.nextUrl.pathname.match(/groups\/([^/]+)\/([^/]+)$/);
  if (!match) return { groupId: null, filename: null };
  return { groupId: match[1], filename: match[2] };
}

export async function GET(request: NextRequest) {
  const { groupId, filename } = getParamsFromUrl(request);
  console.log("[UPLOADS][GET] groupId:", groupId, "filename:", filename);
  if (!groupId || !filename) {
    console.error("[UPLOADS][GET] Missing groupId or filename");
    return NextResponse.json(
      { error: "Missing groupId or filename" },
      { status: 400 }
    );
  }
  const filePath = path.join(
    process.cwd(),
    "uploads",
    "groups",
    groupId,
    filename
  );
  try {
    const file = await fs.readFile(filePath);
    // Infer content type from extension (basic)
    const ext = path.extname(filename).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".gif") contentType = "image/gif";
    else if (ext === ".mp4") contentType = "video/mp4";
    // Add more as needed
    console.log(`[UPLOADS][GET] Serving file: ${filePath} as ${contentType}`);
    return new NextResponse(new Uint8Array(file), {
      status: 200,
      headers: { "Content-Type": contentType },
    });
  } catch (err) {
    console.error(`[UPLOADS][GET] File not found: ${filePath}", error:`, err);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
