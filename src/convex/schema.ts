import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Define the feed table
const feed = defineTable({
  // created_by is the user who created the feed
  createdBy: v.string(),

  // title with default value
  title: v.string(),

  // content as an object (JSONB equivalent)
  content: v.object({}),

  // type supporting custom types with default 'article'
  type: v.string(),

  // public flag with default false
  public: v.boolean(),

  // meta as optional object (JSON equivalent)
  meta: v.optional(v.object({})),

  // cover file ID referencing storage
  coverFileId: v.optional(v.id("_storage")),

  // timestamps
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index("created_by", ["createdBy"])
  .index("public", ["public"])
  .index("public_created_at", ["public", "createdAt"]) // For public feeds ordered by creation time (descending)
  .index("created_by_public", ["createdBy", "public"]) // For queries filtering both createdBy and public
  .index("type", ["type"])
  .index("created_at", ["createdAt"]);

// Define the feed_collaborators table for role-based permissions
const feedCollaborators = defineTable({
  // reference to the feed
  feedId: v.id("feed"),

  // reference to the user who is a collaborator
  userId: v.string(),

  // role: 'read', 'edit', or 'admin'
  role: v.union(v.literal("read"), v.literal("edit"), v.literal("admin")),

  // timestamp when added
  addedAt: v.number(),
})
  .index("feedId", ["feedId"])
  .index("userId", ["userId"])
  .index("feedId_userId", ["feedId", "userId"]);

// Combine all tables in the schema
export default defineSchema({
  // ...betterAuthTables, // Include Better Auth tables
  feed,
  feedCollaborators,
});
