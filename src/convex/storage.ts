import { mutation } from './_generated/server';
import { v } from 'convex/values';
import { authComponent } from './auth';
import { hasFeedPermission } from './feeds/feedCollaborators';
import { FILE_VALIDATION, validateFile } from './validation';
import type { Id } from './_generated/dataModel';

// Generate an upload URL for file uploads
export const generateUploadUrl = mutation({
	args: {},
	handler: async (ctx) => {
		return await ctx.storage.generateUploadUrl();
	}
});

// Get a file URL from storage ID
export const getImageUrl = mutation({
	args: { storageId: v.id('_storage') },
	handler: async (ctx, args) => {
		return await ctx.storage.getUrl(args.storageId);
	}
});

// Upload a file to Convex storage and associate it with a feed
export const uploadFeedFile = mutation({
	args: {
		feedId: v.id('feed'), // The feed this file is associated with
		storageId: v.id('_storage'), // Storage ID for the uploaded file
		fileName: v.string(), // Original filename
		mimeType: v.string(), // MIME type of the file
		fileSize: v.number(), // Size of the file in bytes
	},
	handler: async (ctx, args) => {
		// Get the authenticated user
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error('Authentication required');
		}

		// Check if the user has edit permission for this feed
		const hasPermission = await hasFeedPermission(
			ctx,
			args.feedId,
			user._id,
			'edit', // Need edit permission to upload files to a feed
		);
		if (!hasPermission) {
			throw new Error(
				'You do not have permission to upload files to this feed',
			);
		}

		// Validate file type and size using centralized validation
		validateFile(args.mimeType, args.fileSize);

		// Get the URL for the stored file
		const fileUrl = await ctx.storage.getUrl(args.storageId);

		return {
			fileId: args.storageId,
			url: fileUrl,
			fileName: args.fileName,
			mimeType: args.mimeType,
		};
	},
});
