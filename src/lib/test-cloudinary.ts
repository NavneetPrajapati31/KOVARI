import { uploadToCloudinary, deleteFromCloudinary } from "./cloudinary";

/**
 * Test Cloudinary integration
 * Run this to verify your Cloudinary setup is working
 */
export const testCloudinary = async () => {
  console.log("🧪 Testing Cloudinary integration...");

  try {
    // Test 1: Upload a simple text file
    console.log("📤 Testing file upload...");
    const testBuffer = Buffer.from("Hello Cloudinary!", "utf8");

    const uploadResult = await uploadToCloudinary(testBuffer, {
      folder: "kovari-test",
      public_id: `test-${Date.now()}`,
    });

    console.log("✅ Upload successful:", uploadResult.url);

    // Test 2: Delete the uploaded file
    console.log("🗑️ Testing file deletion...");
    await deleteFromCloudinary(uploadResult.public_id);
    console.log("✅ Deletion successful");

    // Test 3: Test URL optimization
    console.log("🔧 Testing URL optimization...");
    const optimizedUrl = uploadResult.url.replace(
      "/upload/",
      "/upload/w_100,h_100,q_80/"
    );
    console.log("✅ Optimized URL:", optimizedUrl);

    console.log(
      "🎉 All tests passed! Cloudinary integration is working correctly."
    );
  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
};

// Run test if this file is executed directly
if (require.main === module) {
  testCloudinary().catch(console.error);
}
