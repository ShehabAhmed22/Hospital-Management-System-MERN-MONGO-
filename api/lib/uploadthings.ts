import mongoose from "mongoose";
import { createUploadthing, type FileRouter } from "uploadthing/express";

const f = createUploadthing();

export const uploadRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new Error("Unauthorized");
      }
      const token = authHeader.substring(7); // Remove "Bearer " prefix

      const session = await mongoose.connection.collection("session").findOne({
        token: token,
      });
      if (!session) {
        console.error("Upload rejected: Session not found in DB");
        throw new Error("Unauthorized");
      }
      // check expireAt

      if (new Date(session.expiresAt) < new Date()) {
        console.error("Upload rejected: Session expired");
        throw new Error("Unauthorized");
      }
      return {
        uploaderId: session.userId,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(`✅ Uploaded by Doctor ID: ${metadata.uploaderId}`);
      console.log(`✅ File URL: ${file.ufsUrl}`);

      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
