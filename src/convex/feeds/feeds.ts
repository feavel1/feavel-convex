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

// Unified query function for all feed queries with dynamic filtering and permission checking
export const unifiedFeedQuery = query({
  args: {
    // Filtering options
    feedIds: v.optional(v.array(v.id("feed"))), // Specific feed IDs to fetch
    type: v.optional(v.string()), // Filter by feed type (article, product, service)
    publicOnly: v.optional(v.boolean()), // Public feeds only
    slug: v.optional(v.string()), // Single feed by slug

    // Pagination
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { feedIds, type, publicOnly, slug, limit = 20, cursor } = args;

    // Handle single feed by slug first
    if (slug) {
      const feed = await ctx.db
        .query("feed")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();

      if (!feed) {
        throw new Error("Feed not found");
      }

      // Only check permission if not explicitly requesting public only, or if feed is not public
      let user = null;
      if (publicOnly !== true) {
        // Get the authenticated user if not publicOnly
        try {
          user = await authComponent.getAuthUser(ctx);
        } catch (error) {
          // Not authenticated
          user = null;
        }

        // If not authenticated and feed is not public, deny access
        if (!user && !feed.public) {
          throw new Error("You do not have permission to access this feed");
        }

        // If authenticated, check permission using hasFeedPermission
        if (user) {
          const hasPermission = await hasFeedPermission(ctx, feed._id, "read");
          if (!hasPermission) {
            throw new Error("You do not have permission to access this feed");
          }
        } else if (!feed.public) {
          // If not authenticated and feed is not public, deny access
          throw new Error("You do not have permission to access this feed");
        }
      } else if (!feed.public) {
        // If publicOnly is true but feed is not public, deny access
        throw new Error("You do not have permission to access this feed");
      }

      return { feeds: [feed], nextCursor: undefined };
    }

    let results = [];

    // For publicOnly queries, avoid user authentication entirely
    if (publicOnly) {
      // Public-only query with efficient indexing - no authentication needed
      let queryBuilder = ctx.db
        .query("feed")
        .withIndex("public_created_at", (q) => {
          if (cursor) {
            const cursorTime = parseInt(cursor);
            return q.eq("public", true).lt("createdAt", cursorTime);
          } else {
            return q.eq("public", true);
          }
        })
        .order("desc");

      results = await queryBuilder.take(limit + 1); // Get one extra to check for next page
    } else {
      // For non-public queries, get the authenticated user first
      let user;
      try {
        user = await authComponent.getAuthUser(ctx);
      } catch (error) {
        // Not authenticated - only allow access to public feeds
        user = null;
      }

      if (feedIds && feedIds.length > 0) {
        // Fetch specific feeds and check permissions for each
        for (const feedId of feedIds) {
          const feed = await ctx.db.get(feedId);
          if (feed) {
            // Check permission if user is authenticated, allow public feeds
            if (user) {
              const hasPermission = await hasFeedPermission(ctx, feedId, "read");
              if (hasPermission) {
                results.push(feed);
              }
            } else {
              // For unauthenticated users, only allow public feeds
              if (feed.public) {
                results.push(feed);
              }
            }
          }
        }
      } else {
        // Get all accessible feeds for the user
        if (user) {
          // For authenticated users, get all feeds they can access
          const userFeeds = await ctx.db
            .query("feed")
            .withIndex("created_by", (q) => q.eq("createdBy", user._id))
            .collect();

          // Get public feeds
          const publicFeeds = await ctx.db
            .query("feed")
            .withIndex("public", (q) => q.eq("public", true))
            .collect();

          // Get feeds where user is a collaborator
          const userCollaborations = await ctx.db
            .query("feedCollaborators")
            .withIndex("userId", (q) => q.eq("userId", user._id))
            .collect();

          const collaborationFeedIds = userCollaborations.map(c => c.feedId);
          const collaborationFeeds = [];
          for (const feedId of collaborationFeedIds) {
            const feed = await ctx.db.get(feedId);
            if (feed) {
              collaborationFeeds.push(feed);
            }
          }

          // Combine all feeds, ensuring no duplicates
          const allFeedsMap = new Map();
          [...userFeeds, ...publicFeeds, ...collaborationFeeds].forEach(feed => {
            if (feed) {
              allFeedsMap.set(feed._id, feed);
            }
          });

          results = Array.from(allFeedsMap.values());

          // Sort by creation date (newest first) for authenticated user view
          results.sort((a, b) => b.createdAt - a.createdAt);
        } else {
          // For unauthenticated users, only get public feeds
          const queryBuilder = ctx.db
            .query("feed")
            .withIndex("public_created_at", (q) => {
              if (cursor) {
                const cursorTime = parseInt(cursor);
                return q.eq("public", true).lt("createdAt", cursorTime);
              } else {
                return q.eq("public", true);
              }
            })
            .order("desc");

          results = await queryBuilder.take(limit + 1); // Get one extra to check for next page
        }
      }
    }

    let feeds = results;
    let nextCursor = undefined;

    // Handle pagination for authenticated user view (non-public, non-specific feed queries)
    if (publicOnly || (feedIds && feedIds.length === 0) || !feedIds) {
      if (results.length > limit) {
        feeds = results.slice(0, limit);
        nextCursor = String(feeds[feeds.length - 1].createdAt);
      }
    }

    // Apply additional filters that can't be handled by indexes
    if (type) {
      feeds = feeds.filter((feed) => feed && feed.type === type);
    }

    return { feeds, nextCursor };
  },
});
