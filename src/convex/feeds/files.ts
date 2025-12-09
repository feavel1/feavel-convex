import { action } from "../_generated/server";
import { v } from "convex/values";
import { authComponent } from "../auth";
import type { Id } from "../_generated/dataModel";
import { hasFeedPermission } from "./feedCollaborators";

// Action: Upload a file to Convex storage and associate it with a feed
export const uploadFeedFile = action({
  args: {
    feedId: v.id("feed"), // The feed this file is associated with
    file: v.string(), // Base64 encoded file data
    fileName: v.string(), // Original filename
    mimeType: v.string(), // MIME type of the file
  },
  handler: async (ctx, args) => {
    // Get the authenticated user
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Authentication required");
    }

    // Check if the user has edit permission for this feed
    const hasPermission = await hasFeedPermission(
      ctx,
      args.feedId,
      user._id,
      "edit" // Need edit permission to upload files to a feed
    );
    if (!hasPermission) {
      throw new Error("You do not have permission to upload files to this feed");
    }

    // Validate file type (only allow images and audio as per requirements)
    const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    const allowedAudioTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/aac"];
    const allowedTypes = [...allowedImageTypes, ...allowedAudioTypes];

    if (!allowedTypes.includes(args.mimeType)) {
      throw new Error(`Unsupported file type: ${args.mimeType}. Allowed types: ${allowedTypes.join(", ")}`);
    }

    // Validate file size (max 10MB = 10 * 1024 * 1024 bytes)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const fileSize = Buffer.from(args.file, 'base64').length;
    if (fileSize > maxFileSize) {
      throw new Error(`File size ${fileSize} bytes exceeds maximum allowed size of ${maxFileSize} bytes`);
    }

    // Instead of storing the buffer directly, we need to use the proper storage pattern
    // First, generate an upload URL
    const uploadUrl = await ctx.storage.generateUploadUrl();

    // Decode the base64 file data to a buffer
    const fileBuffer = Buffer.from(args.file, 'base64');

    // Upload the file to the generated URL
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': args.mimeType,
      },
      body: fileBuffer,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    // Get the storage ID from the response
    const { storageId } = await response.json() as { storageId: Id<"_storage"> };

    // Now get the URL for the stored file using the existing storage function
    // We need to call the existing storage function to get the URL
    // Since we can't directly call other functions from within an action, we need to use the ctx.storage.getUrl method
    const fileUrl = await ctx.storage.getUrl(storageId);

    return {
      fileId: storageId,
      url: fileUrl,
      fileName: args.fileName,
      mimeType: args.mimeType,
    };
  },
});