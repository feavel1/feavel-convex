import { mutation, query } from '../_generated/server';
import { v } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import { authComponent } from '../auth';
import { paginationOptsValidator } from 'convex/server';
import { internal } from '../_generated/api';

// Add a comment to a feed
export const addComment = mutation({
	args: {
		feedId: v.id('feed'),
		content: v.string(),
		parentCommentId: v.optional(v.id('feedComments'))
	},
	returns: v.id('feedComments'),
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

		// Check if user has permission to comment on the feed (public or they have access)
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
					throw new Error('User does not have permission to comment on this feed');
				}
			}
		}

		// If this is a reply, check if the parent comment exists
		if (args.parentCommentId) {
			const parentComment = await ctx.db.get(args.parentCommentId);
			if (!parentComment) {
				throw new Error('Parent comment not found');
			}
		}

		// Create the comment
		if (!user._id) {
			throw new Error('User ID not available');
		}
		const commentId = await ctx.db.insert('feedComments', {
			feedId: args.feedId,
			userId: user._id,
			content: args.content,
			parentCommentId: args.parentCommentId,
			createdAt: Date.now()
		});

		return commentId;
	}
});

// Update a comment
export const updateComment = mutation({
	args: {
		commentId: v.id('feedComments'),
		content: v.string()
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		// Get the authenticated user
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error('User not authenticated');
		}

		// Get the existing comment
		const comment = await ctx.db.get(args.commentId);
		if (!comment) {
			throw new Error('Comment not found');
		}

		// Check if the user is the comment author
		if (!user._id) {
			throw new Error('User ID not available');
		}
		if (comment.userId !== user._id) {
			throw new Error('User does not have permission to update this comment');
		}

		// Update the comment
		await ctx.db.patch(args.commentId, {
			content: args.content,
			updatedAt: Date.now()
		});

		return null;
	}
});

// Delete a comment
export const deleteComment = mutation({
	args: {
		commentId: v.id('feedComments')
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		// Get the authenticated user
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error('User not authenticated');
		}

		// Get the existing comment
		const comment = await ctx.db.get(args.commentId);
		if (!comment) {
			throw new Error('Comment not found');
		}

		// Check if the user is the comment author OR a feed admin
		if (!user._id) {
			throw new Error('User ID not available');
		}
		if (comment.userId !== user._id) {
			// If not the author, check if they're an admin of the feed
			const feed = await ctx.db.get(comment.feedId);
			if (!feed) {
				throw new Error('Feed not found');
			}

			const isCreator = feed.createdBy === user._id;
			if (!isCreator) {
				const collaborator = await ctx.db
					.query('feedCollaborators')
					.withIndex('feedId_userId', (q) => q.eq('feedId', comment.feedId).eq('userId', user._id))
					.unique();

				if (!collaborator || collaborator.role !== 'admin') {
					throw new Error('User does not have permission to delete this comment');
				}
			}
		}

		// If this is a parent comment, also delete child comments recursively
		const childComments = await ctx.db
			.query('feedComments')
			.withIndex('by_parent_comment', (q) => q.eq('parentCommentId', args.commentId))
			.collect();

		for (const child of childComments) {
			await ctx.db.delete(child._id);
		}

		// Delete the comment itself
		await ctx.db.delete(args.commentId);

		return null;
	}
});

// Get comments for a feed
export const getComments = query({
	args: {
		feedId: v.id('feed'),
		parentCommentId: v.optional(v.id('feedComments')),
		paginationOpts: paginationOptsValidator
	},
	returns: v.object({
		page: v.array(
			v.object({
				_id: v.id('feedComments'),
				feedId: v.id('feed'),
				userId: v.string(), // BetterAuth user ID
				parentCommentId: v.optional(v.id('feedComments')),
				content: v.string(),
				createdAt: v.number(),
				updatedAt: v.optional(v.number())
			})
		),
		isDone: v.boolean(),
		continueCursor: v.union(v.string(), v.null())
	}),
	handler: async (ctx, args) => {
		// Check if the feed exists
		const feed = await ctx.db.get(args.feedId);
		if (!feed) {
			throw new Error('Feed not found');
		}

		// Check if user has permission to view comments (public or they have access)
		if (!feed.public) {
			const user = await authComponent.getAuthUser(ctx);
			if (!user) {
				throw new Error('User not authenticated');
			}

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
					throw new Error('User does not have permission to view comments on this feed');
				}
			}
		}

		let queryBuilder;
		if (args.parentCommentId) {
			// Get replies to a specific comment
			queryBuilder = ctx.db
				.query('feedComments')
				.withIndex('by_parent_comment', (q) => q.eq('parentCommentId', args.parentCommentId));
		} else {
			// Get top-level comments for the feed
			queryBuilder = ctx.db
				.query('feedComments')
				.withIndex('by_feed_and_created_at', (q) => q.eq('feedId', args.feedId))
				.filter((q) => q.field('parentCommentId') === null); // Top-level comments only
		}

		const result = await queryBuilder.order('desc').paginate(args.paginationOpts);

		return result;
	}
});

// New function to get top-level comments with user information and engagement data
export const getTopLevelCommentsWithUserInfo = query({
	args: {
		feedId: v.id('feed')
	},
	// returns: v.array(
	// 	v.object({
	// 		_id: v.id('feedComments'),
	// 		feedId: v.id('feed'),
	// 		userId: v.string(), // BetterAuth user ID
	// 		parentCommentId: v.optional(v.id('feedComments')),
	// 		content: v.string(),
	// 		createdAt: v.number(),
	// 		updatedAt: v.optional(v.number()),
	// 		userInfo: v.object({
	// 			name: v.optional(v.string()),
	// 			email: v.optional(v.string()),
	// 			image: v.optional(v.string())
	// 		}),
	// 		engagement: v.object({
	// 			likeCount: v.number(),
	// 			replyCount: v.number()
	// 		})
	// 	})
	// ),
	handler: async (ctx, args) => {
		// Check if the feed exists
		const feed = await ctx.db.get(args.feedId);
		if (!feed) {
			throw new Error('Feed not found');
		}

		// Check if user has permission to view comments (public or they have access)
		if (!feed.public) {
			const user = await authComponent.getAuthUser(ctx);
			if (!user) {
				throw new Error('User not authenticated');
			}

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
					throw new Error('User does not have permission to view comments on this feed');
				}
			}
		}

		// Get all comments for the feed and filter for top-level comments (those with unset parentCommentId)
		// Since optional fields that are unset in Convex can't be reliably filtered with === null
		// Best practice: collect from indexed query and filter in code for small datasets
		const allComments = await ctx.db
			.query('feedComments')
			.withIndex('by_feed_and_created_at', (q) => q.eq('feedId', args.feedId))
			.order('desc')
			.collect();

		// Filter for top-level comments (those with unset parentCommentId field)
		const comments = allComments.filter(comment => comment.parentCommentId === undefined || comment.parentCommentId === null);

		// console.log(comments);

		// Process each comment to include user info and engagement data
		const commentsWithInfo = await Promise.all(
			comments.map(async (comment) => {
				// In this BetterAuth setup, we can't directly access other users' info
				// For now, we'll return basic info. In a production setup, you might want to
				// store user information directly in Convex when a comment is created
				// or build a more elaborate user info retrieval system.

				// For now, just return placeholder info
				// In a real implementation, you would either:
				// 1. Store user info directly with the comment when it's created
				// 2. Use a separate function to resolve user info by ID
				// 3. Implement a more complex user profile system in Convex

				// Count replies to this comment
				const replyCount = await ctx.db
					.query('feedComments')
					.withIndex('by_parent_comment', (q) => q.eq('parentCommentId', comment._id))
					.collect()
					.then((replies) => replies.length);

				// Count likes for this comment (assuming there's a commentLikes table or similar)
				// For now, just set to 0 since we don't have a likes table for comments yet
				const likeCount = 0;

				return {
					...comment,
					userInfo: {
						name: 'User', // Placeholder - in real implementation, fetch from stored profile data
						email: '', // Placeholder
						image: '' // Placeholder
					},
					engagement: {
						likeCount,
						replyCount
					}
				};
			})
		);

		return commentsWithInfo;
	}
});

// New function to get child comments with user information and engagement data for a specific parent
export const getChildCommentsWithUserInfo = query({
	args: {
		parentCommentId: v.id('feedComments')
	},
	// returns: v.array(
	// 	v.object({
	// 		_id: v.id('feedComments'),
	// 		feedId: v.id('feed'),
	// 		userId: v.string(), // BetterAuth user ID
	// 		parentCommentId: v.optional(v.id('feedComments')),
	// 		content: v.string(),
	// 		createdAt: v.number(),
	// 		updatedAt: v.optional(v.number()),
	// 		userInfo: v.object({
	// 			name: v.optional(v.string()),
	// 			email: v.optional(v.string()),
	// 			image: v.optional(v.string())
	// 		}),
	// 		engagement: v.object({
	// 			likeCount: v.number(),
	// 			replyCount: v.number()
	// 		})
	// 	})
	// ),
	handler: async (ctx, args) => {
		// Get the parent comment to verify it exists
		const parentComment = await ctx.db.get(args.parentCommentId);
		if (!parentComment) {
			throw new Error('Parent comment not found');
		}

		// Get the feed to check for permissions
		const feed = await ctx.db.get(parentComment.feedId);
		if (!feed) {
			throw new Error('Feed not found');
		}

		// Check if user has permission to view comments (public or they have access)
		if (!feed.public) {
			const user = await authComponent.getAuthUser(ctx);
			if (!user) {
				throw new Error('User not authenticated');
			}

			if (!user._id) {
				throw new Error('User ID not available');
			}
			const isCreator = feed.createdBy === user._id;
			if (!isCreator) {
				const collaborator = await ctx.db
					.query('feedCollaborators')
					.withIndex('feedId_userId', (q) =>
						q.eq('feedId', parentComment.feedId).eq('userId', user._id)
					)
					.unique();
				if (!collaborator) {
					throw new Error('User does not have permission to view comments on this feed');
				}
			}
		}

		// Get child comments for the parent comment
		const comments = await ctx.db
			.query('feedComments')
			.withIndex('by_parent_comment', (q) => q.eq('parentCommentId', args.parentCommentId))
			.order('desc')
			.collect();

		// Process each comment to include user info and engagement data
		const commentsWithInfo = await Promise.all(
			comments.map(async (comment) => {
				// In this BetterAuth setup, we can't directly access other users' info
				// For now, we'll return basic info. In a production setup, you might want to
				// store user information directly in Convex when a comment is created
				// or build a more elaborate user info retrieval system.

				// For now, just return placeholder info
				// In a real implementation, you would either:
				// 1. Store user info directly with the comment when it's created
				// 2. Use a separate function to resolve user info by ID
				// 3. Implement a more complex user profile system in Convex

				// Count replies to this comment
				const replyCount = await ctx.db
					.query('feedComments')
					.withIndex('by_parent_comment', (q) => q.eq('parentCommentId', comment._id))
					.collect()
					.then((replies) => replies.length);

				// Count likes for this comment
				const likeCount = 0;

				return {
					...comment,
					userInfo: {
						name: 'User', // Placeholder - in real implementation, fetch from stored profile data
						email: '', // Placeholder
						image: '' // Placeholder
					},
					engagement: {
						likeCount,
						replyCount
					}
				};
			})
		);

		return commentsWithInfo;
	}
});
