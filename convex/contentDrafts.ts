import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("contentDrafts").order("desc").collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    type: v.string(),
    status: v.union(
      v.literal("idea"),
      v.literal("drafting"),
      v.literal("review"),
      v.literal("published")
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("contentDrafts", {
      title: args.title,
      type: args.type,
      status: args.status,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("contentDrafts"),
    status: v.union(
      v.literal("idea"),
      v.literal("drafting"),
      v.literal("review"),
      v.literal("published")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("contentDrafts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
