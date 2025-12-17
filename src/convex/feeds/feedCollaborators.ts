import {
	internalMutation,
	mutation,
	query,
	type QueryCtx,
	type MutationCtx,
	type ActionCtx
} from '../_generated/server';
import { v } from 'convex/values';
import { authComponent } from '../auth';
import type { Id } from '../_generated/dataModel';

// Type for feed roles
export type FeedRole = 'read' | 'edit' | 'admin';

// Generic context type for helper functions that work across queries, mutations, and actions
type GenericCtx = QueryCtx | MutationCtx | ActionCtx;

/**
 * Helper function to check if a user has permission for a feed.
 * This function can be called from Convex queries, mutations, and actions.
 *
 * @param ctx - The Convex function context (QueryCtx, MutationCtx, or ActionCtx)
 * @param feedId - The ID of the feed to check permissions for
 * @param userId - The ID of the user to check permissions for
 * @param requiredRole - The minimum role required (default: "read")
 * @returns Promise<boolean> - True if the user has the required permission, false otherwise
 */
export async function hasFeedPermission(
	ctx: QueryCtx,
	feedId: Id<'feed'>,
	requiredRole: FeedRole = 'read'
): Promise<boolean> {
	// Get the feed
	const feed = await ctx.db.get(feedId);
	if (!feed) return false;

	// Allow public read access without authentication
	if (feed.public && requiredRole === 'read') {
		return true;
	}

	// For non-public feeds or higher roles, require authentication
	let user;
	try {
		user = await authComponent.getAuthUser(ctx);
	} catch (error) {
		// Not authenticated → no permission (except public read, already handled)
		return false;
	}

	// Owner always has full access
	if (feed.createdBy === user._id) {
		return true;
	}

	// Look up collaborator using user._id
	const collaborator = await ctx.db
		.query('feedCollaborators')
		.withIndex('feedId_userId', (q) => q.eq('feedId', feedId).eq('userId', user._id))
		.unique();

	if (!collaborator) {
		return false;
	}

	// Role hierarchy check
	const roleHierarchy: Record<FeedRole, number> = {
		read: 1,
		edit: 2,
		admin: 3
	};

	return roleHierarchy[collaborator.role as FeedRole] >= roleHierarchy[requiredRole];
}

/**
 * Helper function to check if a user has admin permission for a feed.
 * This function can be called from Convex queries, mutations, and actions.
 *
 * @param ctx - The Convex function context (QueryCtx, MutationCtx, or ActionCtx)
 * @param feedId - The ID of the feed to check admin permissions for
 * @param userId - The ID of the user to check admin permissions for
 * @returns Promise<boolean> - True if the user has admin permission, false otherwise
 */
export async function hasAdminPermission(
	ctx: QueryCtx,
	feedId: Id<'feed'>,
	userId: string
): Promise<boolean> {
	// Validate context is properly defined
	if (!ctx || !ctx.db) {
		throw new Error('Invalid context: missing database access');
	}

	// Get the feed
	const feed = await ctx.db.get(feedId);
	if (!feed) return false;

	// If user is the owner, they have admin access
	if (feed.createdBy === userId) return true;

	// Check if user is a collaborator with admin permissions
	const collaborator = await ctx.db
		.query('feedCollaborators')
		.withIndex('feedId_userId', (q: any) => q.eq('feedId', feedId).eq('userId', userId))
		.unique();

	return collaborator?.role === 'admin';
}

// Mutation: Add a collaborator to a feed
export const addCollaborator = mutation({
	args: {
		feedId: v.id('feed'),
		userId: v.string(),
		role: v.union(v.literal('read'), v.literal('edit'), v.literal('admin'))
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error('Authentication required');
		}

		// Check if user has admin permission to add collaborators
		const hasPermission = await hasAdminPermission(ctx, args.feedId, user._id);
		if (!hasPermission) {
			throw new Error('You do not have permission to add collaborators to this feed');
		}

		// Check if feed exists
		const feed = await ctx.db.get(args.feedId);
		if (!feed) {
			throw new Error('Feed not found');
		}

		// Skip checking if BetterAuth user exists since they're managed by BetterAuth
		// In a real application, you might want to validate the userId string format

		// Check if user is already a collaborator
		const existingCollaborator = await ctx.db
			.query('feedCollaborators')
			.withIndex('feedId_userId', (q: any) => q.eq('feedId', args.feedId).eq('userId', args.userId))
			.unique();

		if (existingCollaborator) {
			throw new Error('User is already a collaborator on this feed');
		}

		// Add the collaborator
		const collaboratorId = await ctx.db.insert('feedCollaborators', {
			feedId: args.feedId,
			userId: args.userId,
			role: args.role,
			addedAt: Date.now()
		});

		return collaboratorId;
	}
});

// Mutation: Remove a collaborator from a feed
export const removeCollaborator = mutation({
	args: {
		feedId: v.id('feed'),
		userId: v.string()
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error('Authentication required');
		}

		// Check if user has admin permission to remove collaborators
		const hasPermission = await hasAdminPermission(ctx, args.feedId, user._id);
		if (!hasPermission) {
			throw new Error('You do not have permission to remove collaborators from this feed');
		}

		// Check if user is trying to remove themselves
		if (args.userId === user._id) {
			throw new Error(
				'You cannot remove yourself as a collaborator from this feed. Delete the feed instead if you are the owner.'
			);
		}

		// Check if feed exists
		const feed = await ctx.db.get(args.feedId);
		if (!feed) {
			throw new Error('Feed not found');
		}

		// Skip checking if BetterAuth user exists since they're managed by BetterAuth
		// In a real application, you might want to validate the userId string format

		// Check if the user is actually a collaborator
		const collaborator = await ctx.db
			.query('feedCollaborators')
			.withIndex('feedId_userId', (q: any) => q.eq('feedId', args.feedId).eq('userId', args.userId))
			.unique();

		if (!collaborator) {
			throw new Error('User is not a collaborator on this feed');
		}

		// Remove the collaborator
		await ctx.db.delete(collaborator._id);

		return collaborator._id;
	}
});

// Mutation: Update a collaborator's role
export const updateCollaboratorRole = mutation({
	args: {
		feedId: v.id('feed'),
		userId: v.string(),
		role: v.union(v.literal('read'), v.literal('edit'), v.literal('admin'))
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error('Authentication required');
		}

		// Check if user has admin permission to update collaborator roles
		const hasPermission = await hasAdminPermission(ctx, args.feedId, user._id);
		if (!hasPermission) {
			throw new Error('You do not have permission to update collaborator roles for this feed');
		}

		// Check if feed exists
		const feed = await ctx.db.get(args.feedId);
		if (!feed) {
			throw new Error('Feed not found');
		}

		// Skip checking if BetterAuth user exists since they're managed by BetterAuth
		// In a real application, you might want to validate the userId string format

		// Check if the user is a collaborator
		const collaborator = await ctx.db
			.query('feedCollaborators')
			.withIndex('feedId_userId', (q: any) => q.eq('feedId', args.feedId).eq('userId', args.userId))
			.unique();

		if (!collaborator) {
			throw new Error('User is not a collaborator on this feed');
		}

		// Update the role
		await ctx.db.patch(collaborator._id, {
			role: args.role
		});

		return collaborator._id;
	}
});

// Query: Get all collaborators for a specific feed
export const getFeedCollaborators = query({
	args: {
		feedId: v.id('feed')
	},
	handler: async (ctx, args) => {
		let user;
		try {
			user = await authComponent.getAuthUser(ctx);
		} catch (error) {
			// Not authenticated → no permission (except public read, already handled)
			return false;
		}
		// Check if user has read permission to view collaborators
		// The feed owner and any collaborator can view the list of collaborators
		const feed = await ctx.db.get(args.feedId);
		if (!feed) {
			throw new Error('Feed not found');
		}

		// Check if user is the owner
		if (feed.createdBy === user._id) {
			// Owner has access
		} else {
			// Check if user is a collaborator
			const collaborator = await ctx.db
				.query('feedCollaborators')
				.withIndex('feedId_userId', (q: any) => q.eq('feedId', args.feedId).eq('userId', user._id))
				.unique();

			if (!collaborator) {
				throw new Error('You do not have permission to view collaborators for this feed');
			}
		}

		// Get all collaborators for this feed
		const collaborators = await ctx.db
			.query('feedCollaborators')
			.withIndex('feedId', (q: any) => q.eq('feedId', args.feedId))
			.collect();

		// Since users are managed by BetterAuth and not in Convex tables,
		// skip fetching user details from Convex database.
		// Instead, return collaborators with userIds only.
		const collaboratorsWithDetails = collaborators.map((collaborator) => ({
			...collaborator,
			user: null // User details are not available from Convex since they're in BetterAuth
		}));

		return collaboratorsWithDetails;
	}
});

// Query function to search for users that can be added as collaborators
// This function searches for users by email and excludes those already collaborators on the feed
// NOTE: For this implementation, we're returning an empty array since direct BetterAuth user
// access from Convex requires special setup. In a production implementation, this would need
// to integrate with BetterAuth's user management APIs properly.
export const searchUsersForCollaboration = query({
	args: {
		feedId: v.id('feed'),
		emailQuery: v.string()
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			throw new Error('Authentication required');
		}

		// Check if user has admin permission (owner only can add collaborators)
		const feed = await ctx.db.get(args.feedId);
		if (!feed) {
			throw new Error('Feed not found');
		}

		// Only the feed owner can add collaborators, not even admin collaborators
		if (feed.createdBy !== user._id) {
			throw new Error('Only the feed owner can add collaborators');
		}

		// In a real implementation, this would search BetterAuth users
		// For now, return an empty array since we can't access BetterAuth users directly from Convex
		return [];
	}
});

// Internal mutation to clean up feed collaborators when a user is deleted
export const cleanupUserCollaborations = internalMutation({
	args: {
		userId: v.id('user')
	},
	handler: async (ctx, args) => {
		// Remove all collaboration entries for this user
		const userCollaborations = await ctx.db
			.query('feedCollaborators')
			.withIndex('userId', (q) => q.eq('userId', args.userId))
			.collect();

		// Delete each collaboration entry
		for (const collaboration of userCollaborations) {
			await ctx.db.delete(collaboration._id);
		}

		return {
			deletedCollaborations: userCollaborations.length
		};
	}
});
