import { mutation, query } from '../_generated/server';
import { v } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import { internal } from '../_generated/api';
import { authComponent } from '../auth';

// Add a like to a feed
export const addLike = mutation({
	args: {
		feedId: v.id('feed')
	},
	returns: v.id('feedLikes'),
	handler: async (ctx, args) => {
		// Get the authenticated user
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error('User not authenticated');
		}

		// Check if the feed exists
		const feed = await ctx.db.get(args.feedId);
		if (!feed) {
			throw new Error('Feed not found');
		}

		// Check if user has permission to like the feed (public or they have access)
		if (!feed.public) {
			// For private feeds, check if the user is the creator or a collaborator
			if (!user._id) {
				throw new Error('User ID not available');
			}
			const isCreator = feed.createdBy === user._id;
			if (!isCreator) {
				const collaborator = await ctx.db
					.query('feedCollaborators')
					.withIndex('feedId_userId', (q) => q.eq('feedId', args.feedId).eq('userId', user._id))
					.unique();
				if (!collaborator) {
					throw new Error('User does not have permission to like this feed');
				}
			}
		}

		// Check if the user already liked this feed
		if (!user._id) {
			throw new Error('User ID not available');
		}
		const existingLike = await ctx.db
			.query('feedLikes')
			.withIndex('by_feed_and_user', (q) => q.eq('feedId', args.feedId).eq('userId', user._id))
			.unique();

		if (existingLike) {
			// If already liked, return the existing like ID
			return existingLike._id;
		}

		// Create the like
		if (!user._id) {
			throw new Error('User ID not available');
		}
		const likeId = await ctx.db.insert('feedLikes', {
			feedId: args.feedId,
			userId: user._id,
			createdAt: Date.now()
		});

		return likeId;
	}
});

// Remove a like from a feed
export const removeLike = mutation({
	args: {
		feedId: v.id('feed')
	},
	returns: v.boolean(),
	handler: async (ctx, args) => {
		// Get the authenticated user
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error('User not authenticated');
		}

		// Find the like record
		if (!user._id) {
			throw new Error('User ID not available');
		}
		const like = await ctx.db
			.query('feedLikes')
			.withIndex('by_feed_and_user', (q) => q.eq('feedId', args.feedId).eq('userId', user._id))
			.unique();

		if (!like) {
			return false; // No like found to remove
		}

		// Delete the like
		await ctx.db.delete(like._id);
		return true;
	}
});

// Get both like status and count for a specific feed
export const getLikeData = query({
	args: {
		feedId: v.id('feed')
	},
	returns: v.object({
		isLiked: v.boolean(),
		likeCount: v.number()
	}),
	handler: async (ctx, args) => {
		// For non-public feeds or higher roles, require authentication
		let user;
		// Get like count
		const likes = await ctx.db
			.query('feedLikes')
			.withIndex('by_feed', (q) => q.eq('feedId', args.feedId))
			.collect();

		try {
			user = await authComponent.getAuthUser(ctx);
		} catch (error) {
			// Not authenticated →
			return {
				isLiked: false,
				likeCount: likes.length
			};
		}

		// Check if current user liked
		let isLiked = false;
		if (user && user._id) {
			const userLike = await ctx.db
				.query('feedLikes')
				.withIndex('by_feed_and_user', (q) => q.eq('feedId', args.feedId).eq('userId', user._id))
				.unique();
			isLiked = !!userLike;
		}

		return {
			isLiked,
			likeCount: likes.length
		};
	}
});

// Get all feeds liked by the current user
export const getUserFeedLikes = query({
	args: {},
	returns: v.array(
		v.object({
			likeId: v.id('feedLikes'),
			feedId: v.id('feed'),
			createdAt: v.number()
		})
	),
	handler: async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			return []; // Not authenticated, so no likes
		}

		if (!user._id) {
			return []; // No user ID, so no likes
		}
		const userLikes = await ctx.db
			.query('feedLikes')
			.withIndex('by_user', (q) => q.eq('userId', user._id))
			.order('desc')
			.collect();

		return userLikes.map((like) => ({
			likeId: like._id,
			feedId: like.feedId,
			createdAt: like.createdAt
		}));
	}
});
