import { v } from "convex/values";
import { query } from "./_generated/server";

// =============================================================================
// Documents - ドキュメント管理
// =============================================================================

// ドキュメント一覧取得
export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("documents")
      .order("desc")
      .take(limit);
  },
});

// ドキュメント検索
export const search = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    return await ctx.db
      .query("documents")
      .withSearchIndex("search_documents", (q) =>
        q.search("title", args.query)
      )
      .take(limit);
  },
});
