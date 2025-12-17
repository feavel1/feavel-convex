import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Type alias for BetterAuth user ID (stored as string in Convex)
type BetterAuthUserId = string;

// Define the feed table
const feed = defineTable({
  // createdBy is the BetterAuth user ID (string) of the user who created the feed
  createdBy: v.string(),

  // title with default value
  title: v.optional(v.string()),

  // slug for URL-friendly identifier
  slug: v.optional(v.string()),

  // content as an object (JSONB equivalent)
  content: v.optional(v.any()),

  // type supporting custom types with default 'article', 'product', 'service'
  type: v.optional(v.string()),

  // public flag with default false
  public: v.optional(v.boolean()),

  // meta as optional object (JSON equivalent) - allowing flexible meta objects
  meta: v.optional(v.any()),

  // cover file ID referencing storage
  coverFileId: v.optional(v.id("_storage")),

  // language code (ISO 639-1) with default 'en'
  language: v.optional(v.string()),

  // timestamps
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index("created_by", ["createdBy"])
  .index("public", ["public"])
  .index("public_created_at", ["public", "createdAt"]) // For public feeds ordered by creation time (descending)
  .index("created_by_public", ["createdBy", "public"]) // For queries filtering both createdBy and public
  .index("type", ["type"])
  .index("created_at", ["createdAt"])
  .index("by_slug", ["slug"]) // For efficient slug-based lookups
  .index("by_language", ["language"])
  .index("by_public_language_created_at", ["public", "language", "createdAt"]); // For public feeds filtered by language

// Define the feed_collaborators table for role-based permissions
const feedCollaborators = defineTable({
  // reference to the feed
  feedId: v.id("feed"),

  // userId is the BetterAuth user ID (string) of the collaborator
  userId: v.string(),

  // role: 'read', 'edit', or 'admin'
  role: v.union(v.literal("read"), v.literal("edit"), v.literal("admin")),

  // timestamp when added
  addedAt: v.number(),
})
  .index("feedId", ["feedId"])
  .index("userId", ["userId"])
  .index("feedId_userId", ["feedId", "userId"]);

// Define the feedLikes table for tracking feed likes
const feedLikes = defineTable({
  // reference to the feed that was liked
  feedId: v.id("feed"),

  // userId is the BetterAuth user ID (string) of the user who liked the feed
  userId: v.string(),

  // timestamp when the like was created
  createdAt: v.number(),
})
  .index("by_feed_and_user", ["feedId", "userId"]) // For checking if a user already liked a feed
  .index("by_feed", ["feedId"]) // For counting likes per feed
  .index("by_user", ["userId"]); // For retrieving user's likes

// Define the feedComments table for feed comments
const feedComments = defineTable({
  // reference to the feed being commented on
  feedId: v.id("feed"),

  // userId is the BetterAuth user ID (string) of the user who made the comment
  userId: v.string(),

  // reference to parent comment for nested replies (optional)
  parentCommentId: v.optional(v.id("feedComments")),

  // the comment text content
  content: v.string(),

  // timestamps
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index("by_feed", ["feedId"]) // For retrieving all comments for a feed
  .index("by_feed_and_created_at", ["feedId", "createdAt"]) // For chronological comments
  .index("by_parent_comment", ["parentCommentId"]); // For retrieving replies to comments

// Combine all tables in the schema
export default defineSchema({
  // ...betterAuthTables, // Include Better Auth tables
  feed,
  feedCollaborators,
  feedLikes,
  feedComments,
});
