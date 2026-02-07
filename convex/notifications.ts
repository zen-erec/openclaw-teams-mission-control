import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// =============================================================================
// Notifications - 通知管理
// =============================================================================

// 未読通知取得
export const getUnread = query({
  args: {
    agentId: v.id("agents"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("notifications")
      .withIndex("by_unread", (q) =>
        q.eq("mentionedAgentId", args.agentId).eq("read", false)
      )
      .order("desc")
      .take(limit);
  },
});

// 未配信通知取得（デーモン用）
export const getUndelivered = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    const notifications = await ctx.db
      .query("notifications")
      .filter((q) => q.eq(q.field("delivered"), false))
      .order("asc")
      .take(limit);

    // エージェント情報を付加
    const results = [];
    for (const notif of notifications) {
      const agent = await ctx.db.get(notif.mentionedAgentId);
      results.push({
        ...notif,
        agent: agent
          ? { name: agent.name, sessionKey: agent.sessionKey }
          : null,
      });
    }
    return results;
  },
});

// 配信済みマーク
export const markDelivered = mutation({
  args: {
    id: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      delivered: true,
      deliveredAt: Date.now(),
    });
  },
});

// 既読マーク
export const markRead = mutation({
  args: {
    id: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      read: true,
      readAt: Date.now(),
    });
  },
});

// 一括既読マーク
export const markAllRead = mutation({
  args: {
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_unread", (q) =>
        q.eq("mentionedAgentId", args.agentId).eq("read", false)
      )
      .collect();

    for (const notif of unread) {
      await ctx.db.patch(notif._id, {
        read: true,
        readAt: now,
      });
    }

    return { markedCount: unread.length };
  },
});

// 通知作成（直接）
export const create = mutation({
  args: {
    mentionedAgentId: v.id("agents"),
    content: v.string(),
    taskId: v.optional(v.id("tasks")),
    messageId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      mentionedAgentId: args.mentionedAgentId,
      content: args.content,
      taskId: args.taskId,
      messageId: args.messageId,
      delivered: false,
      read: false,
      createdAt: Date.now(),
    });
  },
});

// @all 通知（全エージェントに送信）
export const notifyAll = mutation({
  args: {
    content: v.string(),
    taskId: v.optional(v.id("tasks")),
    excludeAgentIds: v.optional(v.array(v.id("agents"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const agents = await ctx.db.query("agents").collect();
    const excludeSet = new Set(args.excludeAgentIds ?? []);

    const ids = [];
    for (const agent of agents) {
      if (excludeSet.has(agent._id)) continue;

      const id = await ctx.db.insert("notifications", {
        mentionedAgentId: agent._id,
        content: args.content,
        taskId: args.taskId,
        delivered: false,
        read: false,
        createdAt: now,
      });
      ids.push(id);
    }

    return { notifiedCount: ids.length, notificationIds: ids };
  },
});
