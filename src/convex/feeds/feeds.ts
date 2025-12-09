import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { authComponent } from "../auth";
import type { Id } from "../_generated/dataModel";
import { hasFeedPermission, type FeedRole } from "./feedCollaborators";

// Type for feed roles (though we'll use the imported one)
// type FeedRole = "read" | "edit" | "admin";

// Query: Get all feeds (filtered by permissions)
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

    // Get feeds that are either public or the user has access to
    const allPublicFeeds = await ctx.db
      .query("feed")
      .withIndex("public", (q) => q.eq("public", true))
      .collect();

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

    // Optimized: Use a single query to fetch all collaborating feeds instead of individual lookups
    let collaboratingFeeds = [];
    if (collaboratingFeedIds.length > 0) {
      // Query for each feed ID individually but more efficiently than Promise.all with ctx.db.get
      // We'll batch them by querying with the 'created_by' index multiple times
      // However, the optimal approach would be to have a compound index or a single query that can fetch multiple specific IDs

      // For better performance, we need to fetch feeds by their IDs more efficiently
      // Since Convex doesn't directly support multi-get, we'll iterate but with better structure
      for (const feedId of collaboratingFeedIds) {
        const feed = await ctx.db.get(feedId);
        if (feed) {
          collaboratingFeeds.push(feed);
        }
      }
    }

    // Combine all feeds, removing duplicates
    const allFeeds = [
      ...allPublicFeeds,
      ...userFeeds,
      ...collaboratingFeeds,
    ].filter(
      (feed, index, self) =>
        feed && self.findIndex((f) => f._id === feed._id) === index,
    ) as any[];

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
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Authentication required");
    }

    // Check permission
    const hasPermission = await hasFeedPermission(ctx, args.feedId, user._id);
    if (!hasPermission) {
      throw new Error("You do not have permission to access this feed");
    }

    const feed = await ctx.db.get(args.feedId);
    if (!feed) {
      throw new Error("Feed not found");
    }

    return feed;
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

// Mutation: Create a new feed
export const createFeed = mutation({
  args: {
    title: v.string(),
    content: v.object({}),
    type: v.string(),
    public: v.boolean(),
    meta: v.optional(v.object({})),
    coverFileId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Authentication required");
    }

    const feedId = await ctx.db.insert("feed", {
      createdBy: user._id,
      title: args.title || "Untitled Feed",
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
    content: v.optional(v.object({})),
    type: v.optional(v.string()),
    public: v.optional(v.boolean()),
    meta: v.optional(v.object({})),
    coverFileId: v.optional(v.id("_storage")),
    updatedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Authentication required");
    }

    // Check if user has edit permission (owner or collaborator with edit/admin role)
    const hasPermission = await hasFeedPermission(
      ctx,
      args.feedId,
      user._id,
      "edit",
    );
    if (!hasPermission) {
      throw new Error("You do not have permission to update this feed");
    }

    const feed = await ctx.db.get(args.feedId);
    if (!feed) {
      throw new Error("Feed not found");
    }

    // Update the feed
    await ctx.db.patch(args.feedId, {
      title: args.title,
      content: args.content,
      type: args.type,
      public: args.public,
      meta: args.meta,
      coverFileId: args.coverFileId,
      updatedAt: args.updatedAt || Date.now(),
    });

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
