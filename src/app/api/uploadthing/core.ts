import { createUploadthing, type FileRouter } from "uploadthing/next";

// This is the correct way to configure UploadThing
const f = createUploadthing();

// The environment variables are automatically picked up by UploadThing
// UPLOADTHING_SECRET and UPLOADTHING_APP_ID should be in your .env.local file

export const uploadRouter = {
  profileImageUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  }).onUploadComplete(async ({ metadata, file }) => {
    console.log("Upload complete, File URL:", file.url);
    return { url: file.url };
  }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
