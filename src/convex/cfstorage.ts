import { components } from './_generated/api';
import { R2 } from '@convex-dev/r2';
import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { authComponent } from './auth';
import { hasFeedPermission } from './feeds/feedCollaborators';
import { FILE_VALIDATION, validateFile } from './validation';
import type { Id } from './_generated/dataModel';

// Initialize R2 client
export const r2 = new R2(components.r2);

// R2 client API with authentication validation
const r2Callbacks = {
  checkUpload: async (ctx: any, bucket: any) => {
    // Get the authenticated user to validate they can upload
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }
    // Additional validation will be done where we have file details
  },
  onUpload: async (ctx: any, bucket: any, key: any) => {
    console.log(`File uploaded to R2: ${key}`);
  }
};

export const { generateUploadUrl, syncMetadata } = r2.clientApi(r2Callbacks);

// Get an R2 object URL from key
export const getImageUrl = mutation({
  args: {
    key: v.string() // R2 object key
  },
  handler: async (ctx, args) => {
    // Generate a URL for the R2 object with a 1-hour expiration
    return await r2.getUrl(args.key, { expiresIn: 60 * 60 }); // 1 hour
  }
});

// Get permanent URL using custom domain
export const getPermanentUrl = query({
  args: {
    key: v.string() // R2 object key
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    // Return permanent URL with custom domain
    return `https://storage.feavel.com/${args.key}`;
  }
});

// Get decorated thumbnail URL (as requested by the user)
export const getDecoratedThumbnailUrl = query({
  args: {
    key: v.string() // R2 object key
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    // Return permanent URL with custom domain
    return `https://storage.feavel.com/${args.key}`;
  }
});

// Auto-save profile image - returns the permanent URL for the frontend to handle
export const autoSaveProfileImage = mutation({
  args: {
    key: v.string(),
  },
  returns: v.object({
    url: v.string()
  }),
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    // Generate permanent URL to return to client
    // The actual user profile update happens in the frontend via BetterAuth
    const permanentUrl = `https://storage.feavel.com/${args.key}`;

    return { url: permanentUrl };
  }
});

// Auto-save cover image to feed
export const autoSaveCoverImage = mutation({
  args: {
    key: v.string(),
    feedId: v.id('feed')
  },
  returns: v.object({
    key: v.string()
  }),
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    // Check if user has edit permission for this feed
    const hasPermission = await hasFeedPermission(ctx, args.feedId, 'edit');
    if (!hasPermission) {
      throw new Error('You do not have permission to update this feed');
    }

    // Update the feed with the coverFileKey (not URL) to maintain data consistency
    await ctx.db.patch(args.feedId, { coverFileKey: args.key });

    return { key: args.key };
  }
});

// Upload cover image to R2
export const uploadCoverImage = mutation({
  args: {
    file: v.object({
      name: v.string(),
      type: v.string(),
      size: v.number()
    })
  },
  handler: async (ctx, args) => {
    // Validate authentication
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    // Validate file is an image
    if (!args.file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed for cover images');
    }
    // Validate file size (max 5MB for cover images)
    if (args.file.size > 5 * 1024 * 1024) {
      throw new Error('Cover image must be less than 5MB');
    }

    // Generate upload URL using R2
    const uploadUrl = await r2.generateUploadUrl();

    // Return the upload URL and key (for the hook to work properly)
    return {
      uploadUrl: uploadUrl.url,
      key: uploadUrl.key,
      fileName: args.file.name,
      mimeType: args.file.type
    };
  }
});

// Upload profile image to R2
export const uploadProfileImage = mutation({
  args: {
    file: v.object({
      name: v.string(),
      type: v.string(),
      size: v.number()
    })
  },
  handler: async (ctx, args) => {
    // Validate authentication
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    // Validate file is an image
    if (!args.file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed for profile pictures');
    }
    // Validate file size (max 2MB for profile images)
    if (args.file.size > 2 * 1024 * 1024) {
      throw new Error('Profile image must be less than 2MB');
    }

    // Generate upload URL using R2
    const uploadUrl = await r2.generateUploadUrl();

    // Return the upload URL and key (for the hook to work properly)
    return {
      uploadUrl: uploadUrl.url,
      key: uploadUrl.key,
      fileName: args.file.name,
      mimeType: args.file.type
    };
  }
});

// Upload feed file to R2
export const uploadFeedFile = mutation({
  args: {
    feedId: v.id('feed'),
    file: v.object({
      name: v.string(),
      type: v.string(),
      size: v.number()
    })
  },
  handler: async (ctx, args) => {
    // Validate authentication
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    // Check if the user has edit permission for this feed
    const hasPermission = await hasFeedPermission(ctx, args.feedId, 'edit');
    if (!hasPermission) {
      throw new Error('You do not have permission to upload files to this feed');
    }

    // Validate file type and size using centralized validation
    validateFile(args.file.type, args.file.size);

    // Generate upload URL using R2
    const uploadUrl = await r2.generateUploadUrl();

    // Return the upload URL and file information
    return {
      uploadUrl: uploadUrl.url,
      key: uploadUrl.key,
      fileName: args.file.name,
      mimeType: args.file.type,
      fileSize: args.file.size
    };
  }
});

