import { createRouteHandlerSupabaseClient } from "@/lib/supabase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import fs from "fs/promises";
import path from "path";

/**
 * Migration utility to move local media files to Cloudinary
 * Run this script to migrate existing local files to Cloudinary
 */
export const migrateLocalToCloudinary = async () => {
  const supabase = createRouteHandlerSupabaseClient();

  try {
    // Get all media records with local URLs
    const { data: mediaRecords, error } = await supabase
      .from("group_media")
      .select("id, url, group_id, type, uploaded_by")
      .like("url", "/api/uploads/groups/%");

    if (error) {
      console.error("Error fetching media records:", error);
      return;
    }

    console.log(
      `Found ${mediaRecords?.length || 0} local media files to migrate`
    );

    for (const record of mediaRecords || []) {
      try {
        // Extract filename from URL
        const urlParts = record.url.split("/");
        const filename = urlParts[urlParts.length - 1];
        const groupId = record.group_id;

        // Construct local file path
        const localFilePath = path.join(
          process.cwd(),
          "public",
          "uploads",
          "groups",
          groupId,
          filename
        );

        // Check if file exists locally
        try {
          await fs.access(localFilePath);
        } catch (fileError) {
          console.log(`File not found locally: ${localFilePath}, skipping...`);
          continue;
        }

        // Read file and upload to Cloudinary
        const fileBuffer = await fs.readFile(localFilePath);

        const uploadResult = await uploadToCloudinary(fileBuffer, {
          folder: `kovari-groups/${groupId}`,
          resource_type: record.type === "video" ? "video" : "image",
          public_id: filename.replace(/\.[^/.]+$/, ""), // Remove extension for public_id
        });

        // Update database record
        const { error: updateError } = await supabase
          .from("group_media")
          .update({
            url: uploadResult.secure_url,
            cloudinary_public_id: uploadResult.public_id,
          })
          .eq("id", record.id);

        if (updateError) {
          console.error(`Error updating record ${record.id}:`, updateError);
        } else {
          console.log(
            `Successfully migrated: ${record.url} -> ${uploadResult.secure_url}`
          );

          // Optionally delete local file after successful migration
          // await fs.unlink(localFilePath);
        }
      } catch (migrationError) {
        console.error(`Error migrating record ${record.id}:`, migrationError);
      }
    }

    console.log("Migration completed!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  migrateLocalToCloudinary();
}
