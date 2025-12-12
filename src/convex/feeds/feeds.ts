import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { authComponent } from "../auth";
import type { Doc, Id, TableNames } from "../_generated/dataModel";
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

type FeedDoc = Doc<"feed">;
type FeedCollaboratorDoc = Doc<"feedCollaborators">;

export const unifiedFeedQuery = query({
  args: {
    feedIds: v.optional(v.array(v.id("feed"))),
    type: v.optional(v.string()),
    publicOnly: v.optional(v.boolean()),
    slug: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const {
      feedIds,
      type,
      publicOnly,
      slug,
      limit = 20,
      cursor,
      userId,
    } = args;
    const isSingleRequest = !!slug || feedIds?.length === 1;

    // 1. HANDLE SINGLE FEED BY SLUG
    if (slug) {
      const feed = await ctx.db
        .query("feed")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();

      if (!feed) throw new Error("Feed not found");

      // Public feeds always accessible
      if (feed.public) return { feeds: [feed], nextCursor: undefined };

      // Private feed handling
      if (publicOnly)
        throw new Error("You do not have permission to access this feed");

      const user = await authComponent.getAuthUser(ctx).catch(() => null);
      if (!user)
        throw new Error("You do not have permission to access this feed");

      // Direct permission check (creator or collaborator)
      const isCreator = feed.createdBy === user._id;
      const isCollaborator = await ctx.db
        .query("feedCollaborators")
        .withIndex("feedId_userId", (q) =>
          q.eq("feedId", feed._id).eq("userId", user._id),
        )
        .unique();

      if (!isCreator && !isCollaborator) {
        throw new Error("You do not have permission to access this feed");
      }

      return { feeds: [feed], nextCursor: undefined };
    }

    // 2. DETERMINE QUERY MODE
    const user = await authComponent.getAuthUser(ctx).catch(() => null);
    const isPublicQuery = publicOnly || !user;
    let finalFeeds: FeedDoc[] = [];
    let nextCursor: string | undefined = undefined;

    // When userId is provided, check permissions to access that user's feeds
    if (userId) {
      // For now, only allow the current authenticated user to access their own feeds
      // In the future, you could implement admin access or other permission systems
      if (!user || user._id !== userId) {
        // For security, only allow users to access their own feeds via userId parameter
        // This could be expanded to allow access to other users' feeds based on permissions
        throw new Error(
          "You do not have permission to access this user's feeds",
        );
      }
    }

    // 3. PUBLIC FEEDS MODE (optimized path)
    if (isPublicQuery && !userId) {
      let queryBuilder = ctx.db
        .query("feed")
        .withIndex("public_created_at", (q) => {
          if (cursor) {
            return q.eq("public", true).lt("createdAt", parseInt(cursor));
          }
          return q.eq("public", true);
        })
        .order("desc");

      // Apply type filter after index query
      if (type) {
        queryBuilder = queryBuilder.filter((q) => q.eq(q.field("type"), type));
      }

      const results = await queryBuilder.take(limit + 1);
      finalFeeds = results.slice(0, limit);
      if (results.length > limit) {
        nextCursor = String(finalFeeds[finalFeeds.length - 1].createdAt);
      }
    }
    // 4. AUTHENTICATED USER MODE (non-public) OR USER-SPECIFIC QUERY
    else {
      // 4a. SPECIFIC FEED IDS REQUEST
      if (feedIds?.length) {
        const validFeeds: FeedDoc[] = [];
        const feedChecks = feedIds.map(async (feedId) => {
          const feed = await ctx.db.get(feedId as Id<"feed">);
          if (!feed) return null;

          // Skip type-filtered feeds early
          if (type && feed.type !== type) return null;

          // If userId is specified, check if feed belongs to that user
          if (userId && feed.createdBy !== userId) return null;

          // Permission check (creator or collaborator)
          if (feed.createdBy === user!._id) return feed;

          const isCollaborator = await ctx.db
            .query("feedCollaborators")
            .withIndex("feedId_userId", (q) =>
              q.eq("feedId", feedId).eq("userId", user!._id),
            )
            .unique();

          return isCollaborator ? feed : null;
        });

        (await Promise.all(feedChecks)).forEach((feed) => {
          if (feed) validFeeds.push(feed);
        });
        finalFeeds = validFeeds;
      }
      // 4b. USER-SPECIFIC FEEDS (created by specific user) OR USER'S PERSONAL FEEDS (created + collaborations)
      else {
        // If userId is specified, only fetch feeds created by that user
        if (userId) {
          // Get feeds created by the specified user
          let creatorQuery = ctx.db
            .query("feed")
            .withIndex("created_by", (q) => q.eq("createdBy", userId))
            .order("desc");

          if (type) {
            creatorQuery = creatorQuery.filter((q) =>
              q.eq(q.field("type"), type),
            );
          }

          finalFeeds = await creatorQuery.take(limit + 1);
          if (finalFeeds.length > limit) {
            nextCursor = String(finalFeeds[limit].createdAt);
            finalFeeds = finalFeeds.slice(0, limit);
          }
        }
        // If no userId specified, fetch current user's feeds (created + collaborations)
        else {
          // Get creator feeds
          let creatorQuery = ctx.db
            .query("feed")
            .withIndex("created_by", (q) => q.eq("createdBy", user!._id))
            .order("desc");

          if (type) {
            creatorQuery = creatorQuery.filter((q) =>
              q.eq(q.field("type"), type),
            );
          }

          // Get collaboration feed IDs first
          const collaborations = await ctx.db
            .query("feedCollaborators")
            .withIndex("userId", (q) => q.eq("userId", user!._id))
            .collect();

          const collaborationFeedIds = collaborations.map((c) => c.feedId);

          // Batch fetch collaboration feeds
          const collaborationFeeds = (
            await Promise.all(
              collaborationFeedIds.map((id) => ctx.db.get(id as Id<"feed">)),
            )
          ).filter(
            (feed): feed is FeedDoc =>
              feed !== null && (!type || feed.type === type),
          );

          // Merge feeds with deduplication
          const allFeedsMap = new Map<string, FeedDoc>();
          (await creatorQuery.collect()).forEach((feed) => {
            allFeedsMap.set(feed._id, feed);
          });

          collaborationFeeds.forEach((feed) => {
            allFeedsMap.set(feed._id, feed);
          });

          // Manual pagination with cursor support
          let sortedFeeds = Array.from(allFeedsMap.values()).sort(
            (a, b) => b.createdAt - a.createdAt,
          );

          if (cursor) {
            const cursorTime = parseInt(cursor);
            sortedFeeds = sortedFeeds.filter((f) => f.createdAt < cursorTime);
          }

          finalFeeds = sortedFeeds.slice(0, limit);
          if (sortedFeeds.length > limit) {
            nextCursor = String(finalFeeds[finalFeeds.length - 1].createdAt);
          }
        }
      }
    }

    return {
      feeds: isSingleRequest ? finalFeeds.slice(0, 1) : finalFeeds,
      nextCursor: isSingleRequest ? undefined : nextCursor,
    };
  },
});
