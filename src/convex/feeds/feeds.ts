import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { authComponent } from "../auth";
import type { Id } from "../_generated/dataModel";
import { hasFeedPermission, type FeedRole } from "./feedCollaborators";

// Helper function to generate URL-friendly slugs
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/--+/g, "-") // Replace multiple hyphens with single hyphen
    .trim();
}

// Helper function to ensure slug uniqueness by appending numbers if needed
async function ensureUniqueSlug(ctx: any, baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  let existingFeed = await ctx.db
    .query("feed")
    .withIndex("by_slug", (q: any) => q.eq("slug", slug))
    .unique();

  while (existingFeed) {
    slug = `${baseSlug}-${counter}`;
    existingFeed = await ctx.db
      .query("feed")
      .withIndex("by_slug", (q: any) => q.eq("slug", slug))
      .unique();
    counter++;
  }

  return slug;
}

// Type for feed roles (though we'll use the imported one)
// type FeedRole = "read" | "edit" | "admin";

// Helper function to fetch feeds by multiple IDs efficiently
async function getFeedsByIds(ctx: any, feedIds: string[]) {
  if (feedIds.length === 0) return [];

  // Since Convex doesn't support multi-get directly, we'll fetch them efficiently in batches
  const feeds = [];
  for (const feedId of feedIds) {
    const feed = await ctx.db.get(feedId);
    if (feed) {
      feeds.push(feed);
    }
  }
  return feeds;
}

// Query: Get all feeds (filtered by permissions) with optimized fetching
export const getAllFeeds = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Authentication required");
    }
    const { limit = 20, cursor } = args;

    // Get feeds created by the user
    const userFeeds = await ctx.db
      .query("feed")
      .withIndex("created_by", (q) => q.eq("createdBy", user._id))
      .collect();

    // Get feeds where the user is a collaborator
    const userCollaborations = await ctx.db
      .query("feedCollaborators")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .collect();

    const collaboratingFeedIds = userCollaborations.map((c) => c.feedId);

    // Fetch collaborating feeds efficiently
    const collaboratingFeeds = await getFeedsByIds(ctx, collaboratingFeedIds);

    // For public feeds, we only include them if they're not already included in user feeds or collaborating feeds
    const userAndCollaboratingFeedIds = new Set([
      ...userFeeds.map((feed) => feed._id),
      ...collaboratingFeeds.map((feed) => feed._id),
    ]);

    // Get additional public feeds that the user doesn't already have access to
    const allPublicFeeds = await ctx.db
      .query("feed")
      .withIndex("public", (q) => q.eq("public", true))
      .collect();

    const additionalPublicFeeds = allPublicFeeds.filter(
      (feed) => !userAndCollaboratingFeedIds.has(feed._id),
    );

    // Combine all feeds
    const allFeeds = [
      ...userFeeds,
      ...collaboratingFeeds,
      ...additionalPublicFeeds,
    ];

    // Sort by creation date (newest first)
    allFeeds.sort((a, b) => b.createdAt - a.createdAt);

    // Apply pagination
    const startIndex = cursor ? parseInt(cursor) : 0;
    const endIndex = startIndex + limit;
    const paginatedFeeds = allFeeds.slice(startIndex, endIndex);

    const nextCursor =
      endIndex < allFeeds.length ? endIndex.toString() : undefined;

    return {
      feeds: paginatedFeeds,
      nextCursor,
    };
  },
});

// Query: Get a single feed by ID with permission check
export const getFeedById = query({
  args: {
    feedId: v.id("feed"),
  },
  handler: async (ctx, args) => {
    const hasPermission = hasFeedPermission(ctx, args.feedId);

    if (!hasPermission) {
      throw new Error("You do not have permission to access this feed");
    } else {
      const feed = await ctx.db.get(args.feedId);
      if (!feed) {
        throw new Error("Feed not found");
      }
      return feed;
    }
  },
});

// Query: Get all feeds by a specific user
export const getFeedsByUser = query({
  args: {
    userId: v.string(),
    publicOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Authentication required");
    }

    // Check if the requesting user is the same as the requested user or has permission
    if (user._id !== args.userId) {
      // For now, only the user themselves can see their own feeds (unless public)
      // For public feeds, other users can see them
      if (args.publicOnly !== true) {
        throw new Error("You can only view your own feeds");
      }
    }

    let feeds;
    if (args.publicOnly) {
      feeds = await ctx.db
        .query("feed")
        .withIndex("created_by", (q: any) =>
          q.eq("createdBy", args.userId).eq("public", true),
        )
        .collect();
    } else {
      feeds = await ctx.db
        .query("feed")
        .withIndex("created_by", (q: any) => q.eq("createdBy", args.userId))
        .collect();
    }

    // Filter to only include public feeds if the requesting user is not the owner
    const filteredFeeds =
      user._id === args.userId ? feeds : feeds.filter((feed) => feed.public);

    return filteredFeeds;
  },
});

// Query: Get all public feeds
export const getPublicFeeds = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { limit = 20, cursor } = args;

    // For compound index [public, createdAt], we need to fully specify the public field
    // and can then do range operations on createdAt
    let queryBuilder = ctx.db
      .query("feed")
      .withIndex("public_created_at", (q) => {
        if (cursor) {
          const cursorTime = parseInt(cursor);
          // For descending order, return entries with createdAt < cursorTime
          return q.eq("public", true).lt("createdAt", cursorTime);
        } else {
          return q.eq("public", true);
        }
      })
      .order("desc");

    const results = await queryBuilder.take(limit + 1); // Get one extra to check for next page

    let feeds = results;
    let nextCursor = undefined;

    if (results.length > limit) {
      // Remove the extra item and set the next cursor
      feeds = results.slice(0, limit);
      // Use the creation time of the last item as the cursor
      nextCursor = String(feeds[feeds.length - 1].createdAt);
    }

    return {
      feeds,
      nextCursor,
    };
  },
});

// Query: Get feeds by type with permission filtering
export const getFeedsByType = query({
  args: {
    type: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Authentication required");
    }

    const { type, limit = 20, cursor } = args;

    // Get feeds created by the user of specific type
    let userFeeds;
    if (type) {
      userFeeds = await ctx.db
        .query("feed")
        .withIndex("created_by", (q) => q.eq("createdBy", user._id))
        .collect();
      // Filter by type after fetching
      userFeeds = userFeeds.filter(feed => feed.type === type);
    } else {
      userFeeds = await ctx.db
        .query("feed")
        .withIndex("created_by", (q) => q.eq("createdBy", user._id))
        .collect();
    }

    // Get feeds where the user is a collaborator of specific type
    const userCollaborations = await ctx.db
      .query("feedCollaborators")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .collect();

    const collaboratingFeedIds = userCollaborations.map((c) => c.feedId);

    // Fetch collaborating feeds efficiently
    const collaboratingFeeds = await getFeedsByIds(ctx, collaboratingFeedIds)
      .then(feeds => type ? feeds.filter(feed => feed.type === type) : feeds);

    // For public feeds of specific type that the user doesn't already have access to
    const userAndCollaboratingFeedIds = new Set([
      ...userFeeds.map((feed) => feed._id),
      ...collaboratingFeeds.map((feed) => feed._id),
    ]);

    // Get additional public feeds of specific type that the user doesn't already have access to
    let allPublicFeeds;
    if (type) {
      allPublicFeeds = await ctx.db
        .query("feed")
        .withIndex("public", (q) => q.eq("public", true))
        .collect();
      // Filter by type after fetching
      allPublicFeeds = allPublicFeeds.filter(feed => feed.type === type);
    } else {
      allPublicFeeds = await ctx.db
        .query("feed")
        .withIndex("public", (q) => q.eq("public", true))
        .collect();
    }

    const additionalPublicFeeds = allPublicFeeds.filter(
      (feed) => !userAndCollaboratingFeedIds.has(feed._id),
    );

    // Combine all feeds
    const allFeeds = [
      ...userFeeds,
      ...collaboratingFeeds,
      ...additionalPublicFeeds,
    ];

    // Sort by creation date (newest first)
    allFeeds.sort((a, b) => b.createdAt - a.createdAt);

    // Apply pagination if needed
    const startIndex = cursor ? parseInt(cursor) : 0;
    const endIndex = startIndex + limit;
    const paginatedFeeds = allFeeds.slice(startIndex, endIndex);

    const nextCursor =
      endIndex < allFeeds.length ? endIndex.toString() : undefined;

    return {
      feeds: paginatedFeeds,
      nextCursor,
    };
  },
});

// Query: Get a single feed by slug with permission check
export const getFeedBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the feed by slug
    const feed = await ctx.db
      .query("feed")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!feed) {
      throw new Error("Feed not found");
    }

    // Check permission using the existing permission system
    const hasPermission = await hasFeedPermission(ctx, feed._id);
    if (!hasPermission) {
      throw new Error("You do not have permission to access this feed");
    }

    return feed;
  },
});

// Mutation: Create a new feed
export const createFeed = mutation({
  args: {
    title: v.string(),
    content: v.any(),
    type: v.string(),
    public: v.boolean(),
    meta: v.optional(v.any()),
    coverFileId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Authentication required");
    }

    // Generate slug from title
    const baseSlug = generateSlug(args.title);
    const uniqueSlug = await ensureUniqueSlug(ctx, baseSlug);

    const feedId = await ctx.db.insert("feed", {
      createdBy: user._id,
      title: args.title || "Untitled Feed",
      slug: uniqueSlug,
      content: args.content || {},
      type: args.type || "article",
      public: args.public || false,
      meta: args.meta,
      coverFileId: args.coverFileId,
      createdAt: Date.now(),
    });

    return feedId;
  },
});

// Mutation: Update an existing feed
export const updateFeed = mutation({
  args: {
    feedId: v.id("feed"),
    title: v.optional(v.string()),
    content: v.optional(v.any()),
    type: v.optional(v.string()),
    public: v.optional(v.boolean()),
    meta: v.optional(v.any()),
    coverFileId: v.optional(v.id("_storage")),
    updatedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Authentication required");
    }

    // Check if user has edit permission (owner or collaborator with edit/admin role)
    const hasPermission = await hasFeedPermission(ctx, args.feedId, "edit");
    if (!hasPermission) {
      throw new Error("You do not have permission to update this feed");
    }

    const feed = await ctx.db.get(args.feedId);
    if (!feed) {
      throw new Error("Feed not found");
    }

    // Prepare the updates object, only including defined values
    const updates: any = {};

    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;
    if (args.type !== undefined) updates.type = args.type;
    if (args.public !== undefined) updates.public = args.public;
    if (args.meta !== undefined) updates.meta = args.meta;
    if (args.coverFileId !== undefined) updates.coverFileId = args.coverFileId;
    updates.updatedAt = args.updatedAt || Date.now();

    // If the title is being updated, also update the slug
    if (args.title && args.title !== feed.title) {
      const baseSlug = generateSlug(args.title);
      const uniqueSlug = await ensureUniqueSlug(ctx, baseSlug);
      updates.slug = uniqueSlug;
    }

    // Update the feed
    await ctx.db.patch(args.feedId, updates);

    return args.feedId;
  },
});

// Mutation: Delete a feed
export const deleteFeed = mutation({
  args: {
    feedId: v.id("feed"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Authentication required");
    }

    // Only the owner can delete a feed
    const feed = await ctx.db.get(args.feedId);
    if (!feed) {
      throw new Error("Feed not found");
    }

    if (feed.createdBy !== user._id) {
      throw new Error("You do not have permission to delete this feed");
    }

    // Delete the feed and any associated collaborators
    await ctx.db.delete(args.feedId);

    // Remove all collaboration entries for this feed
    const collaborators = await ctx.db
      .query("feedCollaborators")
      .withIndex("feedId", (q) => q.eq("feedId", args.feedId))
      .collect();

    for (const collaborator of collaborators) {
      await ctx.db.delete(collaborator._id);
    }

    return args.feedId;
  },
});
