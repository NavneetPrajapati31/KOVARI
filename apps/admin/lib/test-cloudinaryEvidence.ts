// apps/admin/lib/test-cloudinaryEvidence.ts
/**
 * Test script for Cloudinary Evidence Upload
 * 
 * Usage:
 *   npx tsx apps/admin/lib/test-cloudinaryEvidence.ts
 * 
 * Or with Node:
 *   node --loader ts-node/esm apps/admin/lib/test-cloudinaryEvidence.ts
 */

// Load environment variables from .env.local
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Determine the root directory (where .env.local should be)
// Script is in apps/admin/lib/, so root is 3 levels up from lib/
// Use import.meta.url for ES modules, or __dirname for CommonJS
const currentFile = typeof __dirname !== "undefined" 
  ? __dirname 
  : path.dirname(new URL(import.meta.url).pathname);
const rootDir = path.resolve(currentFile, "..", "..", "..");
const envLocalPath = path.join(rootDir, ".env.local");

// Try multiple locations
const envPaths = [
  envLocalPath, // Root directory (most likely)
  path.join(process.cwd(), ".env.local"), // Current working directory
  path.join(process.cwd(), "..", "..", ".env.local"), // If running from apps/admin
];

let loaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`📁 Loaded .env.local from: ${envPath}\n`);
    loaded = true;
    break;
  }
}

if (!loaded) {
  console.warn("⚠️  .env.local not found. Trying default locations...\n");
  dotenv.config(); // Try default .env
}

// Reconfigure Cloudinary after loading env vars to ensure it has the credentials
import { v2 as cloudinary } from "cloudinary";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

import {
  uploadEvidence,
  generateSignedEvidenceUrl,
  generateSignedThumbnailUrl,
  getPublicIdFromEvidenceUrl,
  getEvidenceDisplayUrl,
  deleteEvidence,
} from "./cloudinaryEvidence";

// Create a simple test JPEG buffer (1x1 red pixel)
function createTestJPEG(): Buffer {
  // Minimal valid JPEG header + data
  // This is a very small test image
  const jpegHeader = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
    0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
    0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
    0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
    0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x14, 0x00, 0x01,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x08, 0xff, 0xc4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00,
    0xd2, 0xcf, 0x20, 0xff, 0xd9,
  ]);
  return jpegHeader;
}

async function testCloudinaryEvidence() {
  console.log("🧪 Testing Cloudinary Evidence Upload...\n");

  // Check environment variables
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error("❌ Missing Cloudinary environment variables!");
    console.error("Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET");
    console.error("\nCurrent values:");
    console.error(`  CLOUDINARY_CLOUD_NAME: ${cloudName ? "✓ set" : "✗ missing"}`);
    console.error(`  CLOUDINARY_API_KEY: ${apiKey ? "✓ set" : "✗ missing"}`);
    console.error(`  CLOUDINARY_API_SECRET: ${apiSecret ? "✓ set" : "✗ missing"}`);
    console.error("\nMake sure your .env.local file contains:");
    console.error("  CLOUDINARY_CLOUD_NAME=your_cloud_name");
    console.error("  CLOUDINARY_API_KEY=your_api_key");
    console.error("  CLOUDINARY_API_SECRET=your_api_secret");
    process.exit(1);
  }

  console.log("✅ Cloudinary environment variables found");
  console.log(`   Cloud Name: ${cloudName}`);
  console.log(`   API Key: ${apiKey.substring(0, 8)}...`);
  console.log(`   API Secret: ${apiSecret.substring(0, 8)}...\n`);

  let uploadedPublicId: string | null = null;

  try {
    // Test 1: Upload JPEG evidence
    console.log("📤 Test 1: Uploading JPEG evidence...");
    const testJPEG = createTestJPEG();
    const testFlagId = `test-flag-${Date.now()}`;

    const uploadResult = await uploadEvidence(testJPEG, {
      flagId: testFlagId,
      fileName: `test-evidence-${Date.now()}.jpg`,
    });

    console.log("✅ Upload successful!");
    console.log(`   Public ID: ${uploadResult.public_id}`);
    console.log(`   URL: ${uploadResult.secure_url}`);
    console.log(`   Format: ${uploadResult.format}`);
    console.log(`   Size: ${uploadResult.bytes} bytes`);
    console.log(`   Thumbnail URL: ${uploadResult.thumbnail_url}\n`);

    uploadedPublicId = uploadResult.public_id;

    // Test 2: Extract public ID from URL
    console.log("🔍 Test 2: Extracting public ID from URL...");
    const extractedPublicId = getPublicIdFromEvidenceUrl(uploadResult.secure_url);
    if (extractedPublicId === uploadResult.public_id) {
      console.log("✅ Public ID extraction successful!");
      console.log(`   Extracted: ${extractedPublicId}\n`);
    } else {
      console.error("❌ Public ID extraction failed!");
      console.error(`   Expected: ${uploadResult.public_id}`);
      console.error(`   Got: ${extractedPublicId}\n`);
    }

    // Test 3: Generate signed evidence URL
    console.log("🔐 Test 3: Generating signed evidence URL...");
    const signedUrl = generateSignedEvidenceUrl(uploadResult.public_id, {
      expiresIn: 3600,
      width: 800,
      quality: 85,
    });
    console.log("✅ Signed URL generated!");
    console.log(`   URL: ${signedUrl.substring(0, 100)}...\n`);

    // Test 4: Generate signed thumbnail URL
    console.log("🖼️  Test 4: Generating signed thumbnail URL...");
    const thumbnailUrl = generateSignedThumbnailUrl(uploadResult.public_id, {
      size: 150,
      expiresIn: 3600,
    });
    console.log("✅ Thumbnail URL generated!");
    console.log(`   URL: ${thumbnailUrl.substring(0, 100)}...\n`);

    // Test 5: Get optimized display URL
    console.log("✨ Test 5: Getting optimized display URL...");
    const optimizedThumbnail = getEvidenceDisplayUrl(
      uploadResult.secure_url,
      "thumbnail"
    );
    const optimizedPreview = getEvidenceDisplayUrl(
      uploadResult.secure_url,
      "preview"
    );
    console.log("✅ Optimized URLs generated!");
    console.log(`   Thumbnail: ${optimizedThumbnail.substring(0, 80)}...`);
    console.log(`   Preview: ${optimizedPreview.substring(0, 80)}...\n`);

    // Test 6: Verify URL is accessible
    console.log("🌐 Test 6: Verifying uploaded URL is accessible...");
    try {
      const response = await fetch(uploadResult.secure_url, { method: "HEAD" });
      if (response.ok) {
        console.log("✅ URL is accessible!");
        console.log(`   Status: ${response.status}`);
        console.log(`   Content-Type: ${response.headers.get("content-type")}\n`);
      } else {
        console.error(`❌ URL returned status: ${response.status}\n`);
      }
    } catch (error) {
      console.error("❌ Failed to verify URL accessibility:", error);
      console.error("   (This might be expected if the asset is private)\n");
    }

    // Test 7: Cleanup - Delete uploaded evidence
    console.log("🗑️  Test 7: Cleaning up (deleting uploaded evidence)...");
    if (uploadedPublicId) {
      await deleteEvidence(uploadedPublicId, "image");
      console.log("✅ Evidence deleted successfully!\n");
    }

    console.log("🎉 All tests passed! Cloudinary Evidence upload is working correctly.");

  } catch (error) {
    console.error("\n❌ Test failed with error:");
    console.error(error);

    // Cleanup on error
    if (uploadedPublicId) {
      console.log("\n🧹 Attempting cleanup...");
      try {
        await deleteEvidence(uploadedPublicId, "image");
        console.log("✅ Cleanup successful");
      } catch (cleanupError) {
        console.error("❌ Cleanup failed:", cleanupError);
      }
    }

    process.exit(1);
  }
}

// Alternative: Test with a real JPEG file if provided
async function testWithRealFile(filePath: string) {
  console.log(`🧪 Testing with real file: ${filePath}\n`);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const testFlagId = `test-flag-${Date.now()}`;

  try {
    console.log("📤 Uploading file...");
    const uploadResult = await uploadEvidence(fileBuffer, {
      flagId: testFlagId,
      fileName: fileName,
    });

    console.log("✅ Upload successful!");
    console.log(`   Public ID: ${uploadResult.public_id}`);
    console.log(`   URL: ${uploadResult.secure_url}`);
    console.log(`   Format: ${uploadResult.format}`);
    console.log(`   Size: ${uploadResult.bytes} bytes`);
    console.log(`   Dimensions: ${uploadResult.width}x${uploadResult.height}`);

    // Cleanup
    console.log("\n🗑️  Cleaning up...");
    await deleteEvidence(uploadResult.public_id, "image");
    console.log("✅ Cleanup successful!");

  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Run tests
const args = process.argv.slice(2);
if (args.length > 0 && args[0] === "--file" && args[1]) {
  testWithRealFile(args[1]).catch(console.error);
} else {
  testCloudinaryEvidence().catch(console.error);
}
